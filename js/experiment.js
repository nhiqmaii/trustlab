/**
 * experiment.js — the experiment state machine.
 *
 * Phases: intro -> trial(x N) -> complete.
 * Per trial:
 *   1) Show prompt
 *   2) Show AI answer + confidence
 *   3) Participant: accept or override (if override, type answer)
 *   4) Reveal correct answer
 *   5) Advance
 *
 * All timing captured with performance.now() for millisecond precision.
 */
const Experiment = (() => {
  const root = () => document.getElementById('exp-root');
  let session = null;
  let idx = 0;
  let trialStart = 0;

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- boot ----------
  function init() {
    renderIntro();
  }

  // ---------- intro ----------
  function renderIntro() {
    root().innerHTML = `
      <section class="card">
        <p class="eyebrow">Consent &amp; instructions</p>
        <h2>Before you begin</h2>
        <p>You are about to complete a short cognitive task with ${Stimuli.count} trials.
        Each trial presents a trivia question along with an answer from an AI assistant
        and a stated confidence level.</p>
        <p>For every trial, you decide whether to <strong>accept the AI's answer</strong> or
        <strong>override</strong> it with your own. We record your choice, your response time,
        and whether the final answer was correct.</p>
        <p>The AI in this study is <strong>scripted</strong>, not a live language model.
        This is a deliberate design decision so that every participant sees the exact same
        stimulus &mdash; see the <a href="methodology.html" class="link">methodology</a> for details.</p>
        <p><strong>Your data stays on your device.</strong> Nothing is sent to a server.
        You can review the full policy on the <a href="ethics.html" class="link">ethics</a> page.</p>
        <div class="hstack" style="margin-top:20px;">
          <button class="btn btn--primary btn--big" id="exp-start">I understand &mdash; start the study</button>
          <a class="btn btn--ghost" href="index.html">Cancel</a>
        </div>
      </section>`;
    document.getElementById('exp-start').addEventListener('click', begin);
  }

  function begin() {
    session = Store.startSession();
    idx = 0;
    renderTrial();
  }

  // ---------- trial ----------
  function renderTrial() {
    const stim = Stimuli.all[idx];
    trialStart = performance.now();
    const pct = Math.round(((idx) / Stimuli.count) * 100);

    root().innerHTML = `
      <div class="exp-progress" aria-hidden="true">
        <div class="exp-progress__bar" style="width:${pct}%"></div>
      </div>
      <p class="exp-progress__label mono">Trial ${idx + 1} of ${Stimuli.count} &middot; ${esc(stim.category)}</p>

      <section class="card exp-card">
        <h2 class="exp-question">${esc(stim.prompt)}</h2>

        <div class="exp-ai">
          <div class="exp-ai__head">
            <span class="exp-ai__label mono">AI assistant</span>
            <span class="exp-conf ${confidenceClass(stim.aiConfidence)}">
              confidence: ${Math.round(stim.aiConfidence * 100)}%
            </span>
          </div>
          <p class="exp-ai__answer">${esc(stim.aiAnswer)}</p>
        </div>

        <div class="exp-choice">
          <p class="exp-choice__label">Do you accept the AI's answer, or override with your own?</p>
          <div class="hstack">
            <button class="btn btn--primary" id="exp-accept">Accept AI's answer</button>
            <button class="btn btn--ghost" id="exp-override">Override with my answer</button>
          </div>
        </div>
      </section>`;

    document.getElementById('exp-accept').addEventListener('click', () => onDecision('accept'));
    document.getElementById('exp-override').addEventListener('click', () => onDecision('override'));
  }

  function confidenceClass(c) {
    if (c >= 0.85) return 'exp-conf--high';
    if (c >= 0.65) return 'exp-conf--med';
    return 'exp-conf--low';
  }

  // ---------- decision + optional override input ----------
  function onDecision(decision) {
    const decisionRT = Math.round(performance.now() - trialStart);
    if (decision === 'accept') {
      finishTrial({ decision, userAnswer: null, decisionRT, answerRT: 0 });
    } else {
      renderOverrideInput(decisionRT);
    }
  }

  function renderOverrideInput(decisionRT) {
    const stim = Stimuli.all[idx];
    const answerStart = performance.now();
    root().insertAdjacentHTML('beforeend', `
      <section class="card exp-override">
        <h3>Your answer</h3>
        <form id="exp-override-form">
          <input id="exp-override-input" type="text" autocomplete="off"
                 placeholder="Type your answer..." required />
          <button class="btn btn--primary" type="submit">Submit</button>
        </form>
        <p class="muted" style="margin-top:8px;font-size:0.85rem;">
          The correct answer will be shown after you submit.
        </p>
      </section>`);
    const input = document.getElementById('exp-override-input');
    input.focus();
    document.getElementById('exp-override-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const answerRT = Math.round(performance.now() - answerStart);
      finishTrial({
        decision: 'override',
        userAnswer: input.value.trim(),
        decisionRT,
        answerRT,
      });
    });
  }

  // ---------- reveal + advance ----------
  function finishTrial(partial) {
    const stim = Stimuli.all[idx];
    const finalAnswer = partial.decision === 'accept' ? stim.aiAnswer : partial.userAnswer;
    const correct = evaluate(finalAnswer, stim.correctAnswer);

    const trial = {
      stimId: stim.id,
      category: stim.category,
      aiConfidence: stim.aiConfidence,
      aiIsCorrect: stim.aiIsCorrect,
      decision: partial.decision,
      userAnswer: partial.userAnswer,
      finalAnswer,
      correct,
      decisionRT: partial.decisionRT,
      answerRT: partial.answerRT,
    };
    Store.recordTrial(trial);
    renderReveal(stim, trial);
  }

  // Loose string match: case-insensitive, punctuation-stripped, first word of a longer answer counts.
  function evaluate(userAnswer, correctAnswer) {
    if (userAnswer == null) return false;
    const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const u = normalize(userAnswer);
    const c = normalize(correctAnswer);
    if (!u || !c) return false;
    return u === c || u.includes(c) || c.includes(u);
  }

  function renderReveal(stim, trial) {
    const verdict = trial.correct ? 'correct' : 'incorrect';
    const aiVerdict = stim.aiIsCorrect ? 'was correct' : 'was incorrect';
    root().innerHTML = `
      <div class="exp-progress" aria-hidden="true">
        <div class="exp-progress__bar" style="width:${Math.round(((idx + 1) / Stimuli.count) * 100)}%"></div>
      </div>
      <p class="exp-progress__label mono">Trial ${idx + 1} of ${Stimuli.count} &middot; reveal</p>

      <section class="card exp-reveal exp-reveal--${verdict}">
        <p class="exp-reveal__badge mono">Your answer was ${verdict}</p>
        <h2>The correct answer is <span class="exp-answer">${esc(stim.correctAnswer)}</span></h2>
        <p class="muted">
          You <strong>${trial.decision === 'accept' ? 'accepted' : 'overrode'}</strong> the AI, which ${aiVerdict}
          (stated confidence ${Math.round(stim.aiConfidence * 100)}%).
          Decision time: ${trial.decisionRT} ms.
        </p>
        <div class="hstack" style="margin-top:20px;">
          <button class="btn btn--primary" id="exp-next">${idx + 1 < Stimuli.count ? 'Next trial' : 'See my results'}</button>
        </div>
      </section>`;
    document.getElementById('exp-next').addEventListener('click', advance);
  }

  function advance() {
    idx++;
    if (idx >= Stimuli.count) {
      Store.completeSession();
      location.href = 'results.html';
    } else {
      renderTrial();
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Experiment.init);
