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
function generateTiles(currentWord) {
  const w = currentWord.toUpperCase();

  // Must tile: exactly 1 (the final letter)
  const mustLetter = w[w.length - 1];

  // Bonus tiles: up to 3 letters before the last
  const bonusLetters = w.slice(-Math.min(w.length, 4), -1).split('');

  // Plain tiles: fill up to 10 total
  const plainCount = 10 - 1 - bonusLetters.length;
  let plainLetters = [];
  let attempts = 0;
  do {
    plainLetters = [];
    for (let i = 0; i < plainCount; i++) {
      plainLetters.push(LETTER_FREQ[Math.floor(Math.random() * LETTER_FREQ.length)]);
    }
    attempts++;
    // Ensure at least 2 vowels in the plain set
  } while (attempts < 20 && plainLetters.filter(l => 'AEIOU'.includes(l)).length < 2);

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
