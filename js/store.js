/**
 * store.js — participant session storage.
 * A "session" is one run of the experiment. Stored locally, never leaves the browser
 * unless the participant explicitly exports. See ethics.html for the full policy.
 */
const Store = (() => {
  const KEY = 'trustlab:v1';

  const defaults = () => ({
    sessions: [],       // array of completed sessions
    currentSession: null, // in-progress session
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
    } catch (e) {
      console.warn('Store load failed, starting fresh:', e);
      return defaults();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- session lifecycle ----------
  function startSession() {
    state.currentSession = {
      id: uid(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      trials: [],
    };
    save();
    return state.currentSession;
  }

  function recordTrial(trial) {
    if (!state.currentSession) startSession();
    state.currentSession.trials.push(trial);
    save();
  }

  function completeSession() {
    if (!state.currentSession) return null;
    state.currentSession.completedAt = new Date().toISOString();
    state.sessions.push(state.currentSession);
    const done = state.currentSession;
    state.currentSession = null;
    save();
    return done;
  }

  function currentSession() { return state.currentSession; }
  function latestSession() { return state.sessions[state.sessions.length - 1] || null; }
  function allSessions() { return state.sessions; }

  function reset() { state = defaults(); save(); }

  return {
    startSession, recordTrial, completeSession,
    currentSession, latestSession, allSessions, reset,
  };
})();
