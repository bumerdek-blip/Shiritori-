// ── SCREEN NAVIGATION ────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function showLevelSelect() {
  buildLevelGrid();
  showScreen('levels');
}

// ── LEVEL GRID ────────────────────────────────────────────────────────────────

function buildLevelGrid() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';

  BIRDS.forEach((bird, i) => {
    const btn  = document.createElement('button');
    const done = STATE.completedLevels.includes(i);
    const open = i < STATE.unlockedLevels;

    btn.className = 'level-btn ' + (done ? 'completed' : open ? 'unlocked' : 'locked');
    btn.innerHTML =
      `<span class="lnum">${i + 1}</span>` +
      `<span class="lbird">${BIRD_EMOJIS[i]}</span>` +
      `<span>${bird}</span>`;

    if (open) btn.onclick = () => startLevel(i);
    grid.appendChild(btn);
  });
}
