// ── GAME STATE ────────────────────────────────────────────────────────────────

const STATE = {
  // Progress (persisted)
  unlockedLevels:   parseInt(localStorage.getItem('unlocked') || '1'),
  completedLevels:  JSON.parse(localStorage.getItem('completed') || '[]'),

  // Current level
  currentLevel: 0,
  score:        0,
  chain:        [],
  currentWord:  '',   // uppercase, letters only
  usedWords:    new Set(),

  // Timer (resets to 60 after each accepted word)
  timeLeft:      60,
  timerInterval: null,
  paused:        false,

  // Hint
  hintVisible: false,
  hintUsed:    false,

  // Tile input
  tiles:       [],   // [{letter, type:'must'|'bonus'|'plain', id}]
  selectedIds: [],   // ordered list of selected tile ids

  // Async guard
  validating: false,
};

function saveProgress() {
  localStorage.setItem('unlocked',   STATE.unlockedLevels);
  localStorage.setItem('completed',  JSON.stringify(STATE.completedLevels));
}

// ── SCORING ───────────────────────────────────────────────────────────────────

/**
 * How many letters at the START of newWord match a suffix of currentWord.
 * The last letter of currentWord (1 char) is the REQUIRED minimum match.
 * Matching more of the tail earns bonus multiplier.
 *
 * Returns { matchLen, hasMust }
 *   matchLen – number of leading letters that chain (0 if invalid)
 *   hasMust  – true if the required last letter is included
 */
function getChainInfo(currentWord, newWord) {
  const c = currentWord.toUpperCase();
  const n = newWord.toUpperCase();

  // Required: newWord must start with the last letter of currentWord
  const mustLetter = c[c.length - 1];
  if (n[0] !== mustLetter) return { matchLen: 0, hasMust: false };

  // Check how many more letters continue the chain (up to 4 total)
  let matchLen = 1;
  const maxCheck = Math.min(c.length, n.length, 4);
  for (let len = 2; len <= maxCheck; len++) {
    if (c.endsWith(n.slice(0, len))) matchLen = len;
  }

  return { matchLen, hasMust: true };
}

/**
 * Chain multiplier based on how many trailing letters were matched.
 *   1 letter  = ×1.0  (just the required last letter)
 *   2 letters = ×1.25
 *   3 letters = ×1.5
 *   4 letters = ×2.0
 */
function getChainMultiplier(matchLen) {
  if (matchLen >= 4) return 2.0;
  if (matchLen === 3) return 1.5;
  if (matchLen === 2) return 1.25;
  return 1.0;
}

/** Final score for a word. Base = word length. */
function calcScore(wordLen, matchLen, isBird) {
  let mult = getChainMultiplier(matchLen);
  if (isBird) mult *= 1.5;
  return Math.round(wordLen * mult * 10) / 10;
}

/** Score threshold to pass a level. Increases progressively. */
function getThreshold(levelIdx) {
  return Math.round(50 + levelIdx * 12 + Math.pow(levelIdx, 1.3) * 2);
}
