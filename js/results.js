/**
 * results.js — personal report rendered after a completed session.
 * If no session exists, prompt the user to run the study.
 */
(() => {
  const root = document.getElementById('results-root');
  if (!root) return;

  const session = Store.latestSession();
  if (!session) {
    root.innerHTML = `
      <section class="card">
        <p class="eyebrow">No session yet</p>
        <h2>You have not completed the study on this device</h2>
        <p>Run the 10-trial task first, and this page will show your personal decision profile.</p>
        <a class="btn btn--primary" href="experiment.html">Run the study</a>
      </section>`;
    return;
  }

  const s = Analytics.summarize(session);
  const agg = Aggregate.summary();

  const pct = (v) => v == null ? '—' : `${Math.round(v * 100)}%`;

  root.innerHTML =
    header(s, agg) +
    accepancyCard(s, agg) +
    sensitivityCard(s, agg) +
    accuracyCard(s, agg) +
    rawTrialsCard(session) +
    exportCard(session);

  wireExport(session);

  // ------- fragments -------
  function header(s, agg) {
    return `
      <section class="card">
        <p class="eyebrow">Your results</p>
        <h2>You are ${Analytics.relianceLabel(s.acceptanceRate)},<br />
        and ${Analytics.sensitivityLabel(s.confidenceSensitivity)}.</h2>
        <p class="lede">
          Across ${s.n} trials you accepted the AI on ${pct(s.acceptanceRate)} of decisions
          with a median response time of ${s.medianRT} ms. Your final answer was correct
          on ${pct(s.accuracy)} of trials.
        </p>
        <div class="grid-4" style="margin-top:16px;">
          ${stat(pct(s.acceptanceRate), 'Acceptance rate')}
          ${stat(pct(s.accuracy), 'Accuracy')}
          ${stat(pct(s.confidenceSensitivity), 'Confidence sensitivity')}
          ${stat(s.medianRT + ' ms', 'Median decision time')}
        </div>
      </section>`;
  }

  function accepancyCard(s, agg) {
    return `
      <section class="card">
        <h2>Acceptance vs. the aggregate</h2>
        <p class="muted">How often you deferred to the AI, compared to the ${agg.n}-participant simulated pilot.</p>
        ${Charts.barChart({
          items: [
            { label: 'You',       value: s.acceptanceRate, highlight: true, hint: 'Your acceptance rate' },
            { label: 'Aggregate', value: agg.meanAcceptance, hint: 'Mean across simulated participants' },
          ],
          valueMax: 1,
          formatValue: (v) => pct(v),
        })}
      </section>`;
  }

  function sensitivityCard(s, agg) {
    const hi = s.acceptHigh, lo = s.acceptLow;
    return `
      <section class="card">
        <h2>Sensitivity to the AI's stated confidence</h2>
        <p class="muted">
          The gap between how often you accepted <em>high-confidence</em> AI answers vs
          <em>low-confidence</em> AI answers. A larger gap suggests you used AI confidence
          as a decision cue.
        </p>
        ${Charts.barChart({
          items: [
            { label: 'You · high-conf AI',       value: hi ?? 0, highlight: true },
            { label: 'You · low-conf AI',        value: lo ?? 0, highlight: true },
            { label: 'Aggregate · high-conf AI', value: agg.acceptHigh },
            { label: 'Aggregate · low-conf AI',  value: agg.acceptLow },
          ],
          valueMax: 1,
          formatValue: (v) => pct(v),
        })}
        <p style="margin-top:12px;" class="muted">
          Your sensitivity score: <strong class="mono">${pct(s.confidenceSensitivity)}</strong>
          &middot; aggregate mean: <span class="mono">${pct(agg.meanSensitivity)}</span>
        </p>
      </section>`;
  }

  function accuracyCard(s, agg) {
    return `
      <section class="card">
        <h2>Accuracy in context</h2>
        <p class="muted">
          Two useful reference points: if you had accepted the AI on every trial,
          you would have scored ${pct(s.alwaysAcceptAccuracy)} (because the scripted AI
          was correct on ${Math.round(s.alwaysAcceptAccuracy * s.n)} of ${s.n} trials).
          On the trials you actually overrode, your own answer was correct
          ${pct(s.overrideAccuracy)} of the time.
        </p>
        ${Charts.barChart({
          items: [
            { label: 'You (final answers)', value: s.accuracy, highlight: true },
            { label: 'Always-accept-AI',    value: s.alwaysAcceptAccuracy },
            { label: 'Your overrides only', value: s.overrideAccuracy ?? 0 },
            { label: 'Aggregate mean',      value: agg.meanAccuracy },
          ],
          valueMax: 1,
          formatValue: (v) => pct(v),
        })}
      </section>`;
  }

  function rawTrialsCard(session) {
    const rows = session.trials.map((t, i) => `
      <tr>
        <td class="mono">${i + 1}</td>
        <td>${t.category}</td>
        <td class="mono">${Math.round(t.aiConfidence * 100)}%</td>
        <td>${t.aiIsCorrect ? 'yes' : 'no'}</td>
        <td>${t.decision}</td>
        <td>${t.correct ? '<span class="ok">yes</span>' : '<span class="bad">no</span>'}</td>
        <td class="mono">${t.decisionRT}</td>
      </tr>`).join('');
    return `
      <section class="card">
        <h2>Trial-by-trial log</h2>
        <div style="overflow-x:auto;">
          <table class="results-table">
            <thead>
              <tr>
                <th>#</th><th>Category</th><th>AI conf.</th><th>AI right?</th>
                <th>Decision</th><th>Correct?</th><th>RT ms</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  }

  function exportCard(session) {
    return `
      <section class="card">
        <h2>Your data, in your hands</h2>
        <p class="muted">
          Nothing here has been sent anywhere. Export a JSON copy for your own records,
          or wipe every trace of your session from this device.
        </p>
        <div class="hstack" style="margin-top:12px;">
          <button class="btn btn--primary" id="results-export">Export session as JSON</button>
          <a class="btn btn--ghost" href="experiment.html">Run again</a>
          <button class="btn btn--ghost" id="results-reset">Delete my data</button>
        </div>
      </section>`;
  }

  function wireExport(session) {
    document.getElementById('results-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `trustlab-session-${session.id}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    document.getElementById('results-reset').addEventListener('click', () => {
      if (confirm('Delete all TrustLab data from this device? No undo.')) {
        Store.reset();
        location.reload();
      }
    });
  }

  function stat(value, label) {
    return `<div class="stat-box">
      <span class="stat-value">${value}</span>
      <span class="stat-label">${label}</span>
    </div>`;
  }
})();
