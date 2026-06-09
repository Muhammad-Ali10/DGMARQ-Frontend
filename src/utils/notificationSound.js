/**
 * Pleasant short notification "ding" via the Web Audio API — no audio asset
 * needed. Two quick sine tones (a rising perfect-fifth) with a soft decay.
 *
 * Sound on/off is a user preference persisted in localStorage and shared across
 * tabs/components via a tiny pub-sub so the bell toggle updates everywhere.
 */

const PREF_KEY = 'dgmarq.notificationSound';

let audioCtx = null;
const getCtx = () => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

export const isSoundEnabled = () => {
  try {
    // Default ON when the user has never chosen.
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
};

const listeners = new Set();
export const subscribeSoundPref = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const setSoundEnabled = (enabled) => {
  try {
    localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  listeners.forEach((fn) => {
    try { fn(enabled); } catch { /* noop */ }
  });
  // A short confirmation chirp when (re)enabling.
  if (enabled) playNotificationSound(true);
};

/**
 * Play the ding. Respects the user preference unless `force` is true (used to
 * preview the sound when the user flips the toggle on).
 */
export const playNotificationSound = (force = false) => {
  if (!force && !isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    // Browsers suspend the context until a user gesture; resume best-effort.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    master.connect(ctx.destination);

    const tone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.exponentialRampToValueAtTime(1, now + start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };

    tone(880, 0, 0.18);     // A5
    tone(1318.5, 0.12, 0.3); // E6 — rising fifth
  } catch {
    /* audio failures must never break the app */
  }
};
