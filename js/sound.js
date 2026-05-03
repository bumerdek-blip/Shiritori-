// ── AUDIO ─────────────────────────────────────────────────────────────────────

let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

/** Play a success chirp. Varies by bird bonus and chain length. */
function playChirp(isBird, matchLen) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    if (isBird) {
      // Bright three-note ascending chirp for bird words
      [660, 880, 1100].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + i * 0.07 + 0.08);
        gain.gain.setValueAtTime(0.18, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
        osc.start(now + i * 0.07);
        osc.stop(now  + i * 0.07 + 0.2);
      });
    } else if (matchLen >= 3) {
      // Pleasant two-note chirp for long chain
      [520, 700].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
        osc.start(now + i * 0.1);
        osc.stop(now  + i * 0.1 + 0.18);
      });
    } else {
      // Soft single chirp for normal words
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.1);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) { /* audio not available */ }
}

/** Play a descending squawk for invalid/rejected words. */
function playBawk() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [300, 220, 180].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + i * 0.06 + 0.1);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
      osc.start(now + i * 0.06);
      osc.stop(now  + i * 0.06 + 0.15);
    });
  } catch (e) { /* audio not available */ }
}
