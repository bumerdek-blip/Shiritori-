// ── TILE GENERATION ───────────────────────────────────────────────────────────

/**
 * Generate 10 tiles for the current word.
 *
 * Tile types:
 *   'must'  – the LAST letter of currentWord (★ marker). Player MUST use this.
 *   'bonus' – the 3 letters before the last (◆ marker). Using them earns chain bonus.
 *   'plain' – 6 random letters from weighted frequency pool.
 *
 * All 10 tiles are shuffled together so their position is random.
 */
/**
 * Check how many words in COMMON_WORDS can be spelled using the given
 * letter array (each letter used at most once, matching tile counts).
 * Only counts words that start with mustLetter (the required chain letter).
 */
function countPlayableWords(letters, mustLetter) {
  const freq = {};
  letters.forEach(l => { freq[l] = (freq[l] || 0) + 1; });

  let count = 0;
  for (const word of COMMON_WORDS) {
    if (word.length < 3) continue;
    if (word[0] !== mustLetter.toLowerCase()) continue;
    const needed = {};
    for (const ch of word) needed[ch] = (needed[ch] || 0) + 1;
    let fits = true;
    for (const [ch, n] of Object.entries(needed)) {
      if ((freq[ch] || 0) < n) { fits = false; break; }
    }
    if (fits) { count++; if (count >= 5) return count; }
  }
  return count;
}

function generateTiles(currentWord) {
  const w = currentWord.toUpperCase();

  // Must tile: exactly 1 (the final letter)
  const mustLetter = w[w.length - 1];

  // Bonus tiles: up to 3 letters before the last
  const bonusLetters = w.slice(-Math.min(w.length, 4), -1).split('');

  // Plain tiles: fill up to 10 total
  const plainCount = 10 - 1 - bonusLetters.length;

  // Fixed letters (must + bonus) that are always present
  const fixedLetters = [mustLetter, ...bonusLetters].map(l => l.toLowerCase());

  // Generate plain letters, retrying until we get at least 5 playable words
  let plainLetters = [];
  let bestPlain = null;
  let bestScore = 0;
  const MAX_ATTEMPTS = 40;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    plainLetters = [];
    for (let i = 0; i < plainCount; i++) {
      plainLetters.push(LETTER_FREQ[Math.floor(Math.random() * LETTER_FREQ.length)]);
    }

    // Require at least 2 vowels in plain set
    const vowels = plainLetters.filter(l => 'AEIOU'.includes(l)).length;
    if (vowels < 2) continue;

    const allLetters = [...fixedLetters, ...plainLetters.map(l => l.toLowerCase())];
    const score = countPlayableWords(allLetters, mustLetter);

    if (score > bestScore) {
      bestScore = score;
      bestPlain = [...plainLetters];
      if (score >= 5) break;  // good enough — stop early
    }
  }

  // Use best found set (may be < 5 if mustLetter is very rare like X, Q, Z)
  plainLetters = bestPlain || plainLetters;

  // Build tile objects
  const tiles = [
    { letter: mustLetter, type: 'must', id: 'must0' },
    ...bonusLetters.map((l, i) => ({ letter: l, type: 'bonus', id: 'bonus' + i })),
    ...plainLetters.map((l, i) => ({ letter: l, type: 'plain', id: 'plain' + i })),
  ];

  // Shuffle all tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  return tiles;
}

// ── TILE RENDERING ────────────────────────────────────────────────────────────

function renderTiles() {
  const grid = document.getElementById('tile-grid');
  grid.innerHTML = '';

  STATE.tiles.forEach(tile => {
    const btn = document.createElement('button');
    btn.className = 'tile';
    if (tile.type === 'must')  btn.classList.add('must-tile');
    if (tile.type === 'bonus') btn.classList.add('bonus-tile');
    if (STATE.selectedIds.includes(tile.id)) btn.classList.add('selected');

    btn.textContent    = tile.letter;
    btn.dataset.id     = tile.id;
    btn.dataset.letter = tile.letter;
    btn.onclick        = () => tapTile(tile.id);
    grid.appendChild(btn);
  });
}

// ── TILE INTERACTION ──────────────────────────────────────────────────────────

function tapTile(id) {
  const idx = STATE.selectedIds.indexOf(id);
  if (idx !== -1) {
    // Deselect: remove from wherever it is in the sequence
    STATE.selectedIds.splice(idx, 1);
  } else {
    STATE.selectedIds.push(id);
  }
  updateBuilderDisplay();
  renderTiles();
}

function clearWord() {
  STATE.selectedIds = [];
  updateBuilderDisplay();
  renderTiles();
  showFeedback('', '');
}

// ── BUILDER DISPLAY ───────────────────────────────────────────────────────────

function getBuiltWord() {
  return STATE.selectedIds.map(id => {
    const t = STATE.tiles.find(t => t.id === id);
    return t ? t.letter : '';
  }).join('');
}

function updateBuilderDisplay() {
  const builder = document.getElementById('word-builder');
  const ph      = document.getElementById('builder-ph');
  const cur     = document.getElementById('builder-cur');
  const sub     = document.getElementById('btn-submit');

  // Remove existing letter spans
  builder.querySelectorAll('.built-letter').forEach(el => el.remove());

  const word = getBuiltWord();

  if (!word) {
    ph.style.display  = 'inline';
    cur.style.display = 'none';
    builder.classList.remove('has-word');
    sub.disabled = true;
    return;
  }

  ph.style.display  = 'none';
  cur.style.display = 'inline-block';
  builder.classList.add('has-word');
  sub.disabled = word.length < 3;

  STATE.selectedIds.forEach(id => {
    const tile = STATE.tiles.find(t => t.id === id);
    if (!tile) return;
    const span = document.createElement('span');
    span.className = 'built-letter';
    if (tile.type === 'must')  span.classList.add('must-letter');
    if (tile.type === 'bonus') span.classList.add('bonus-letter');
    span.textContent = tile.letter;
    builder.insertBefore(span, cur);
  });
}

// ── HINT AUTO-SELECT ──────────────────────────────────────────────────────────

/**
 * Try to select the tiles that spell hintWord.
 * Prioritises must/bonus tiles when they match; uses plain tiles otherwise.
 * Silently fails (no selection) if the tiles can't spell the word.
 */
function autoSelectHint(hintWord) {
  STATE.selectedIds = [];
  const remaining = [...STATE.tiles];

  for (const letter of hintWord.toUpperCase()) {
    // Prefer must/bonus tiles for matching letters
    let idx = remaining.findIndex(t => t.letter === letter && t.type !== 'plain' && !STATE.selectedIds.includes(t.id));
    if (idx === -1) idx = remaining.findIndex(t => t.letter === letter && !STATE.selectedIds.includes(t.id));
    if (idx === -1) { STATE.selectedIds = []; break; }
    STATE.selectedIds.push(remaining[idx].id);
    remaining.splice(idx, 1);
  }

  renderTiles();
  updateBuilderDisplay();
}
