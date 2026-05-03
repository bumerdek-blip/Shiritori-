// ── FEEDBACK ──────────────────────────────────────────────────────────────────

function showFeedback(msg, type) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = 'feedback' + (type ? ' ' + type : '');
}

function flashBuilder() {
  const el = document.getElementById('word-builder');
  el.classList.add('error');
  setTimeout(() => el.classList.remove('error'), 500);
}

// ── SCORE POPUP ───────────────────────────────────────────────────────────────

function showScorePopup(points, isBird, matchLen, baseLen) {
  const card = document.getElementById('game-card');
  const pop  = document.createElement('div');
  pop.className = 'score-popup';

  const chainMult = getChainMultiplier(matchLen);
  let html = `<span class="pop-base">+${baseLen} pts</span>`;
  if (chainMult > 1) {
    const label = matchLen >= 4 ? '×2 chain!' : matchLen === 3 ? '×1.5 chain' : '×1.25 chain';
    html += `<span class="pop-chain">${label}</span>`;
  }
  if (isBird) html += `<span class="pop-bird">🐦 ×1.5 bird!</span>`;
  if (chainMult > 1 || isBird) html += `<span class="pop-total">= ${Math.round(points * 10) / 10}</span>`;

  pop.innerHTML  = html;
  pop.style.left = (10 + Math.random() * 40) + '%';
  pop.style.top  = '20%';
  card.appendChild(pop);
  setTimeout(() => pop.remove(), 1800);
}

// ── TIMER UI ──────────────────────────────────────────────────────────────────

function updateTimerUI() {
  const t   = STATE.timeLeft;
  const pct = (t / 60) * 100;
  const bar = document.getElementById('timer-bar');
  const num = document.getElementById('timer-num');

  bar.style.width = pct + '%';
  bar.className   = 'timer-bar' + (t <= 10 ? ' danger' : t <= 20 ? ' warning' : '');
  num.textContent = t;
  num.className   = 'timer-num' + (t <= 10 ? ' danger' : '');
}

// ── SCORE + PROGRESS UI ───────────────────────────────────────────────────────

function updateScoreUI() {
  const rounded = Math.round(STATE.score * 10) / 10;
  const thresh  = getThreshold(STATE.currentLevel);
  document.getElementById('score-val').textContent    = rounded;
  document.getElementById('progress-fill').style.width = Math.min(100, (STATE.score / thresh) * 100) + '%';
}

// ── CHAIN DISPLAY ─────────────────────────────────────────────────────────────

function renderChain() {
  const wrap = document.getElementById('chain-words');
  wrap.innerHTML = '';

  if (!STATE.chain.length) {
    // Show starting bird word
    const sp = document.createElement('span');
    sp.className   = 'chain-word bird-word';
    sp.textContent = STATE.currentWord;
    wrap.appendChild(sp);
    return;
  }

  STATE.chain.slice(-6).forEach((entry, i) => {
    if (i > 0) {
      const arrow = document.createElement('span');
      arrow.className   = 'chain-arrow';
      arrow.textContent = '›';
      wrap.appendChild(arrow);
    }
    const sp = document.createElement('span');
    sp.className = 'chain-word' + (entry.isBird ? ' bird-word' : '');
    // Highlight chain letters in gold
    if (entry.matchLen > 0 && i > 0) {
      sp.innerHTML = `<span class="chain-link">${entry.word.slice(0, entry.matchLen)}</span>${entry.word.slice(entry.matchLen)}`;
    } else {
      sp.textContent = entry.word;
    }
    wrap.appendChild(sp);
  });
}

// ── PAUSE ─────────────────────────────────────────────────────────────────────

function togglePause() {
  STATE.paused ? resumeGame() : pauseGame();
}

function pauseGame() {
  if (STATE.paused) return;
  STATE.paused = true;
  document.getElementById('pause-overlay').classList.add('active');
  document.getElementById('btn-pause').textContent = '▶';
}

function resumeGame() {
  if (!STATE.paused) return;
  STATE.paused = false;
  document.getElementById('pause-overlay').classList.remove('active');
  document.getElementById('btn-pause').textContent = '⏸';
}

// Auto-pause when app goes to background
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const gameScreen = document.getElementById('screen-game');
    if (gameScreen.classList.contains('active') && !STATE.paused) pauseGame();
  }
});

// ── MODAL ─────────────────────────────────────────────────────────────────────

function showModal(type) {
  const bird    = BIRDS[STATE.currentLevel];
  const thresh  = getThreshold(STATE.currentLevel);
  const rounded = Math.round(STATE.score * 10) / 10;

  document.getElementById('modal-emoji').textContent = type === 'win' ? BIRD_EMOJIS[STATE.currentLevel] : '⏰';
  document.getElementById('modal-title').textContent = type === 'win' ? 'Level Complete!' : "Time's Up!";
  document.getElementById('modal-body').innerHTML    =
    `<span class="modal-score">${rounded}</span>` +
    `<span class="modal-score-label">points — needed ${thresh}</span>` +
    (type === 'win'
      ? `The <strong>${bird}</strong> level is yours! 🎉`
      : `The <strong>${bird}</strong> got away. Try again?`);

  const btns = document.getElementById('modal-btns');
  btns.innerHTML = '';

  if (type === 'win') {
    if (!STATE.completedLevels.includes(STATE.currentLevel)) STATE.completedLevels.push(STATE.currentLevel);
    const next = STATE.currentLevel + 1;
    if (next < BIRDS.length && next >= STATE.unlockedLevels) STATE.unlockedLevels = next + 1;
    saveProgress();

    if (next < BIRDS.length) {
      const b = document.createElement('button');
      b.className   = 'btn-primary';
      b.textContent = `Next: ${BIRDS[next]} →`;
      b.onclick     = () => { hideModal(); startLevel(next); };
      btns.appendChild(b);
    }
  } else {
    const b = document.createElement('button');
    b.className   = 'btn-primary';
    b.textContent = `↺ Restart ${bird}`;
    b.onclick     = () => { hideModal(); startLevel(STATE.currentLevel); };
    btns.appendChild(b);
  }

  const back = document.createElement('button');
  back.className   = 'btn-secondary';
  back.textContent = 'Back to levels';
  back.onclick     = () => { hideModal(); showLevelSelect(); };
  btns.appendChild(back);

  document.getElementById('modal').classList.add('active');
}

function hideModal() {
  document.getElementById('modal').classList.remove('active');
}
