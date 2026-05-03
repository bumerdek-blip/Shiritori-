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

  // Set to true when player is submitting a hinted word — scores 0
  hintWordActive: false,

  // Async guard
  validating: false,
};

function saveProgress() {
  localStorage.setItem('unlocked',   STATE.unlockedLevels);
  localStorage.setItem('completed',  JSON.stringify(STATE.completedLevels));
}

// ── SCORING ───────────────────────────────────────────────────────────────────

/**
 * Check if the new word starts with the must letter (last letter of currentWord).
 * Returns { hasMust }
 */
function getChainInfo(currentWord, newWord) {
  const mustLetter = currentWord[currentWord.length - 1].toUpperCase();
  const hasMust = newWord[0].toUpperCase() === mustLetter;
  return { hasMust };
}

/**
 * Count how many bonus tiles (◆) were used anywhere in the submitted word.
 * Each bonus tile used = +1 to bonusCount, regardless of letter.
 * Tiles are matched by id so duplicates (e.g. two highlighted O's) count separately.
 *
 * selectedIds — ordered list of tile ids the player tapped
 * tiles       — full tile array with type info
 */
function countBonusTilesUsed(selectedIds, tiles) {
  return selectedIds.reduce((count, id) => {
    const tile = tiles.find(t => t.id === id);
    return count + (tile && tile.type === 'bonus' ? 1 : 0);
  }, 0);
}

/**
 * Multiplier based on how many bonus tiles were used anywhere in the word.
 *   0 bonus tiles = ×1.0
 *   1 bonus tile  = ×1.5
 *   2 bonus tiles = ×2.0
 *   3 bonus tiles = ×2.5
 */
function getChainMultiplier(bonusCount) {
  return 1.0 + bonusCount * 0.5;
}

/** Final score for a word. Base = word length. */
function calcScore(wordLen, bonusCount, isBird) {
  let mult = getChainMultiplier(bonusCount);
  if (isBird) mult *= 1.5;
  return Math.round(wordLen * mult * 10) / 10;
}

/** Score threshold to pass a level. Increases progressively. */
function getThreshold(levelIdx) {
  return Math.round(50 + levelIdx * 12 + Math.pow(levelIdx, 1.3) * 2);
}
