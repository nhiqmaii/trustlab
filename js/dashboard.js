/**
 * dashboard.js — renders the aggregate view.
 * If the participant has completed a session, we overlay their score
 * on the aggregate charts so the dashboard doubles as a comparison view.
 */
(() => {
  const root = document.getElementById('dash-root');
  if (!root) return;

  const agg = Aggregate.summary();
  const parts = Aggregate.participants();
  const you = Store.latestSession() ? Analytics.summarize(Store.latestSession()) : null;

  const pct = (v) => v == null ? '—' : `${Math.round(v * 100)}%`;

  root.innerHTML =
    intro() +
    summaryStats() +
    acceptanceHistogram() +
    sensitivityHistogram() +
    scatterCard() +
    methodsLink();

  function intro() {
    return `
      <section class="card">
        <p class="eyebrow">Aggregate results &middot; N = ${agg.n}</p>
        <h2>How participants make decisions with the AI</h2>
        <p class="lede">
          Distributions across the current sample. Where your own session exists,
          your score is overlaid so you can see how you compare.
        </p>
        <div class="notice">
          <strong>Simulated pilot data.</strong> The ${agg.n}-participant dataset shown
          here is generated with a seeded pseudorandom process for demo purposes,
          not collected from real participants. When a backend is added, this module
          swaps out for a fetch() call and every chart on this page keeps working.
        </div>
      </section>`;
  }

  function summaryStats() {
    return `
      <section class="card">
        <h2>At a glance</h2>
        <div class="grid-4">
          ${stat(pct(agg.meanAcceptance), 'Mean acceptance rate')}
          ${stat(pct(agg.meanAccuracy), 'Mean accuracy')}
          ${stat(pct(agg.meanSensitivity), 'Mean confidence sensitivity')}
          ${stat(agg.meanRT + ' ms', 'Mean median RT')}
        </div>
      </section>`;
  }

  function acceptanceHistogram() {
    return `
      <section class="card">
        <h2>Distribution of acceptance rates</h2>
        <p class="muted">
          How often each participant deferred to the AI. Higher values indicate
          greater algorithm appreciation; lower values indicate more skepticism.
        </p>
        ${Charts.histogram({
          values: parts.map((p) => p.acceptanceRate),
          bins: 10,
          youValue: you ? you.acceptanceRate : null,
          xLabel: 'Acceptance rate',
        })}
      </section>`;
  }

  function sensitivityHistogram() {
    return `
      <section class="card">
        <h2>Distribution of confidence sensitivity</h2>
        <p class="muted">
          The gap between acceptance of high-confidence and low-confidence AI answers.
          A larger gap means the participant treated stated confidence as a stronger cue.
        </p>
        ${Charts.histogram({
          values: parts.map((p) => p.confidenceSensitivity),
          bins: 10,
          youValue: you ? you.confidenceSensitivity : null,
          xLabel: 'Confidence sensitivity (high-conf accept rate &minus; low-conf accept rate)',
        })}
      </section>`;
  }

  function scatterCard() {
    return `
      <section class="card">
        <h2>Reliance vs. accuracy</h2>
        <p class="muted">
          Each dot is one simulated participant. X = how often they accepted the AI;
          Y = final accuracy. The scripted AI is right on 6/10 trials, so a participant
          who always accepted would score around 60% &mdash; the "flat line" outcome.
        </p>
        ${Charts.scatter({
          points: parts.map((p) => ({ x: p.acceptanceRate, y: p.accuracy })),
          youPoint: you ? { x: you.acceptanceRate, y: you.accuracy } : null,
          xLabel: 'Acceptance rate',
          yLabel: 'Accuracy',
        })}
      </section>`;
  }

  function methodsLink() {
    return `
      <section class="card">
        <h2>Interpret with care</h2>
        <p>
          This dashboard reports simple descriptive statistics on a scripted-stimulus
          task with a small item pool. Before drawing conclusions, please read the
          <a class="link" href="methodology.html">methodology</a> and the
          <a class="link" href="ethics.html">ethics &amp; privacy</a> pages, which
          document the design decisions and the (many) limitations.
        </p>
      </section>`;
  }

  function stat(value, label) {
    return `<div class="stat-box">
      <span class="stat-value">${value}</span>
      <span class="stat-label">${label}</span>
    </div>`;
  }
})();
