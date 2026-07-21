/**
 * analytics.js — pure functions that summarize a session.
 * No DOM. Reusable by results.html AND the dashboard when displaying
 * an individual-vs-aggregate comparison.
 */
const Analytics = (() => {
  const HIGH_CONF = 0.85;
  const LOW_CONF = 0.65;

  function summarize(session) {
    const t = session.trials;
    const n = t.length;
    if (n === 0) return null;

    const accepted = t.filter((x) => x.decision === 'accept');
    const overrode = t.filter((x) => x.decision === 'override');
    const correct = t.filter((x) => x.correct);

    // AI-confidence-conditional acceptance rates
    const highConfTrials = t.filter((x) => x.aiConfidence >= HIGH_CONF);
    const lowConfTrials  = t.filter((x) => x.aiConfidence <= LOW_CONF);
    const acceptHigh = highConfTrials.length
      ? highConfTrials.filter((x) => x.decision === 'accept').length / highConfTrials.length
      : null;
    const acceptLow = lowConfTrials.length
      ? lowConfTrials.filter((x) => x.decision === 'accept').length / lowConfTrials.length
      : null;

    // Counterfactuals: what if user always accepted / never accepted?
    const alwaysAcceptAcc = t.filter((x) => x.aiIsCorrect).length / n;
    const neverAcceptAcc  = t.filter((x) => !x.aiIsCorrect && x.correct).length / n; // requires user's own guess to be right
    // Note: never-accept accuracy is harder to counterfactualize because we do not know
    // what the participant would have answered on trials they accepted. Kept as an
    // approximation using observed override accuracy.
    const overrideAcc = overrode.length ? overrode.filter((x) => x.correct).length / overrode.length : null;

    const rt = t.map((x) => x.decisionRT);
    const meanRT = rt.reduce((a, b) => a + b, 0) / n;
    const rtSorted = [...rt].sort((a, b) => a - b);
    const medianRT = rtSorted[Math.floor(rtSorted.length / 2)];

    return {
      n,
      acceptanceRate: accepted.length / n,
      overrideRate: overrode.length / n,
      accuracy: correct.length / n,
      acceptHigh,           // acceptance rate on high-confidence AI trials
      acceptLow,            // acceptance rate on low-confidence AI trials
      confidenceSensitivity: (acceptHigh != null && acceptLow != null) ? acceptHigh - acceptLow : null,
      alwaysAcceptAccuracy: alwaysAcceptAcc,
      overrideAccuracy: overrideAcc,
      meanRT: Math.round(meanRT),
      medianRT: Math.round(medianRT),
    };
  }

  // Descriptive labels for the confidence-sensitivity score.
  function sensitivityLabel(delta) {
    if (delta == null) return 'insufficient data';
    if (delta >= 0.35) return 'strongly confidence-sensitive';
    if (delta >= 0.15) return 'moderately confidence-sensitive';
    if (delta >= -0.1) return 'largely confidence-insensitive';
    return 'inverse pattern (accepted low-confidence more)';
  }

  // Classify participant on the algorithm-appreciation / algorithm-aversion spectrum.
  function relianceLabel(acceptanceRate) {
    if (acceptanceRate >= 0.75) return 'high AI reliance';
    if (acceptanceRate >= 0.55) return 'moderate AI reliance';
    if (acceptanceRate >= 0.35) return 'balanced';
    if (acceptanceRate >= 0.2)  return 'AI-skeptical';
    return 'strong AI aversion';
  }

  return { summarize, sensitivityLabel, relianceLabel, HIGH_CONF, LOW_CONF };
})();
