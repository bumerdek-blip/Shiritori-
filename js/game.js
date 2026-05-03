// ── LEVEL INIT ────────────────────────────────────────────────────────────────

function startLevel(levelIdx) {
  clearInterval(STATE.timerInterval);

  const bird      = BIRDS[levelIdx];
  const birdClean = bird.toUpperCase().replace(/[^A-Z]/g, '');

  // Reset state
  STATE.currentLevel = levelIdx;
  STATE.score        = 0;
  STATE.chain        = [];
  STATE.currentWord  = birdClean;
  STATE.usedWords    = new Set([birdClean.toLowerCase()]);
  STATE.timeLeft     = 60;
  STATE.paused       = false;
  STATE.hintVisible    = false;
  STATE.hintUsed       = false;
  STATE.hintWordActive = false;
  STATE.validating   = false;
  STATE.selectedIds  = [];
  STATE.tiles        = generateTiles(birdClean);

  // Reset header UI
  document.getElementById('level-badge').textContent  = 'LVL ' + (levelIdx + 1);
  document.getElementById('level-name').textContent   = bird;
  document.getElementById('score-val').textContent    = '0';
  document.getElementById('score-target').textContent = '/ ' + getThreshold(levelIdx) + ' to pass';
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('btn-hint').className       = 'btn-hint';
  document.getElementById('hint-word').textContent    = '';
  document.getElementById('btn-pause').textContent    = '⏸';
  document.getElementById('pause-overlay').classList.remove('active');

  showFeedback('', '');
  renderChain();
  renderTiles();
  updateBuilderDisplay();
  updateTimerUI();
  showScreen('game');
  startTimer();
}

// ── TIMER ─────────────────────────────────────────────────────────────────────

function startTimer() {
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = setInterval(() => {
    if (STATE.paused) return;
    STATE.timeLeft--;
    updateTimerUI();

    // Show hint button at 20s remaining
    if (STATE.timeLeft === 20 && !STATE.hintUsed) {
      document.getElementById('btn-hint').classList.add('visible');
      STATE.hintVisible = true;
    }

    if (STATE.timeLeft <= 0) {
      clearInterval(STATE.timerInterval);
      showModal('timeout');
    }
  }, 1000);
}

/** Reset the timer back to 60s after a successful word — keeps going until score or timeout. */
function resetTimer() {
  STATE.timeLeft = 60;
  STATE.hintUsed = false;
  document.getElementById('btn-hint').className    = 'btn-hint';
  document.getElementById('hint-word').textContent = '';
  updateTimerUI();
  startTimer();
}

// ── WORD SUBMISSION ───────────────────────────────────────────────────────────

async function submitWord() {
  if (STATE.validating || STATE.paused) return;

  const raw = getBuiltWord();

  // Minimum length
  if (raw.length < 3) {
    showFeedback('Need at least 3 letters!', 'error');
    flashBuilder();
    playBawk();
    return;
  }

  // Chain check: must start with the last letter of currentWord
  const { hasMust } = getChainInfo(STATE.currentWord, raw);
  if (!hasMust) {
    showFeedback(`Must start with "${STATE.currentWord.slice(-1)}" (the bright gold tile)`, 'error');
    flashBuilder();
    playBawk();
    clearWord();
    return;
  }

  // Duplicate check
  if (STATE.usedWords.has(raw.toLowerCase())) {
    showFeedback('Already used that word!', 'error');
    flashBuilder();
    playBawk();
    clearWord();
    return;
  }

  // Dictionary validation
  STATE.validating = true;
  document.getElementById('btn-submit').disabled = true;
  document.getElementById('feedback').innerHTML  =
    '<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span>';

  const valid = await validateWord(raw);
  STATE.validating = false;

  if (!valid) {
    document.getElementById('btn-submit').disabled = false;
    showFeedback(`"${raw}" isn't a valid word`, 'error');
    flashBuilder();
    playBawk();
    clearWord();   // clear input on bad word
    return;
  }

  // ── Word accepted ──────────────────────────────────────────────────────────
  const isBird      = BIRD_SET.has(raw.toLowerCase());
  const bonusCount  = countBonusTilesUsed(STATE.selectedIds, STATE.tiles);
  // Score 0 if this word was provided by the hint system
  const points      = STATE.hintWordActive ? 0 : calcScore(raw.length, bonusCount, isBird);
  const wasHinted   = STATE.hintWordActive;
  STATE.hintWordActive = false;   // reset for next word

  STATE.chain.push({ word: raw, matchLen, isBird, points });
  STATE.usedWords.add(raw.toLowerCase());
  STATE.score       += points;
  STATE.currentWord  = raw;

  // Refresh tiles for next word
  STATE.selectedIds = [];
  STATE.tiles       = generateTiles(raw);

  // Update UI
  updateScoreUI();

  let msg = '';
  if (wasHinted)            msg = '💡 Hint used — no points';
  else if (isBird && bonusCount >= 3) msg = '🐦🔥 Bird + ×2.5 chain!';
  else if (isBird && bonusCount >= 2) msg = '🐦✨ Bird + ×2 chain!';
  else if (isBird && bonusCount >= 1) msg = '🐦 Bird + ×1.5 chain!';
  else if (isBird)          msg = '🐦 Bird bonus! ×1.5';
  else if (bonusCount >= 3) msg = '🔥 Amazing chain! ×2.5';
  else if (bonusCount >= 2) msg = '✨ Great chain! ×2';
  else if (bonusCount >= 1) msg = '👍 Nice chain! ×1.5';
  showFeedback(msg, wasHinted ? 'error' : 'success');

  if (!wasHinted) showScorePopup(points, isBird, bonusCount, raw.length);
  playChirp(wasHinted ? false : isBird, wasHinted ? 0 : bonusCount);

  renderChain();
  renderTiles();
  updateBuilderDisplay();

  // Check win condition
  if (STATE.score >= getThreshold(STATE.currentLevel)) {
    clearInterval(STATE.timerInterval);
    setTimeout(() => showModal('win'), 400);
    return;
  }

  // Reset timer for next word
  resetTimer();
}

// ── DICTIONARY VALIDATION ─────────────────────────────────────────────────────

async function validateWord(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );
    return response.status === 200;
  } catch (e) {
    showFeedback('Network error — check your connection', 'error');
    return false;
  }
}

// ── HINT ──────────────────────────────────────────────────────────────────────

async function useHint() {
  if (STATE.hintUsed) return;
  STATE.hintUsed = true;
  document.getElementById('btn-hint').style.display = 'none';
  document.getElementById('hint-word').textContent  = 'Finding a hint...';

  // The must letter is always the last letter of the current word.
  const mustLetter = STATE.currentWord.slice(-1).toLowerCase();

  // Build a frequency map of available tile letters so we can check
  // whether a candidate word can actually be spelled with the current tiles.
  function canSpellWithTiles(word) {
    const available = {};
    STATE.tiles.forEach(t => {
      const l = t.letter.toLowerCase();
      available[l] = (available[l] || 0) + 1;
    });
    for (const ch of word.toLowerCase()) {
      if (!available[ch]) return false;
      available[ch]--;
    }
    return true;
  }

  // Prefer longer chain matches (more bonus), but always validate against tiles.
  let hint = '';
  for (let len = Math.min(4, STATE.currentWord.length); len >= 1; len--) {
    const sfx        = STATE.currentWord.slice(-len).toLowerCase();
    const candidates = COMMON_WORDS.filter(w =>
      w.startsWith(sfx) && w.length >= 3 && !STATE.usedWords.has(w) && canSpellWithTiles(w)
    );
    if (candidates.length) {
      hint = candidates[Math.floor(Math.random() * Math.min(candidates.length, 5))].toUpperCase();
      break;
    }
  }

  // Safety net: any word starting with must letter that fits the tiles
  if (!hint) {
    const fallback = COMMON_WORDS.filter(w =>
      w.startsWith(mustLetter) && w.length >= 3 && !STATE.usedWords.has(w) && canSpellWithTiles(w)
    );
    if (fallback.length) hint = fallback[0].toUpperCase();
  }

  document.getElementById('hint-word').textContent = hint
    ? `Try: ${hint} (0 pts)`
    : 'No hint available';

  if (hint) { STATE.hintWordActive = true; autoSelectHint(hint); }
}
