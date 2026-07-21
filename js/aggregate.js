/**
 * aggregate.js — synthetic aggregate data for the dashboard.
 *
 * IMPORTANT: this is simulated pilot data, generated with a seeded PRNG so it is
 * reproducible across devices. The dashboard clearly labels it as such.
 * When a real backend is added, this module gets replaced with a fetch()
 * call to the actual data source and everything downstream keeps working.
 */
const Aggregate = (() => {
  const N = 147;   // simulated participants
  const SEED = 8123;

  function rng(seed) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Draw a normal-ish value clamped to [0, 1] via central limit trick.
  function normalizedNormal(rand, mean, spread) {
    const s = (rand() + rand() + rand() + rand() - 2) / 2; // ~ standard normal-ish
    return Math.max(0, Math.min(1, mean + s * spread));
  }

  // Generate one synthetic participant summary.
  function participant(rand) {
    // Latent "algorithm appreciation" trait drives most metrics.
    const appreciation = rand();
    const acceptanceRate = normalizedNormal(rand, 0.4 + appreciation * 0.4, 0.1);

    // People who accept more also tend to be more sensitive to AI confidence.
    const sensitivity = normalizedNormal(rand, 0.15 + appreciation * 0.25, 0.12);
    const acceptHigh = Math.min(1, acceptanceRate + sensitivity / 2);
    const acceptLow = Math.max(0, acceptanceRate - sensitivity / 2);

    // Accuracy: modest positive relationship with acceptance (AI is right ~60% of trials
    // in this stimulus set), but noisy.
    const accuracy = normalizedNormal(rand, 0.55 + acceptanceRate * 0.1, 0.13);

    const medianRT = Math.round(1500 + rand() * 3500); // 1.5s to 5s

    return {
      acceptanceRate,
      overrideRate: 1 - acceptanceRate,
      acceptHigh,
      acceptLow,
      confidenceSensitivity: acceptHigh - acceptLow,
      accuracy,
      medianRT,
    };
  }

  let cache = null;
  function participants() {
    if (cache) return cache;
    const rand = rng(SEED);
    cache = Array.from({ length: N }, () => participant(rand));
    return cache;
  }

  // Aggregate stats
  function summary() {
    const p = participants();
    const mean = (key) => p.reduce((a, x) => a + x[key], 0) / p.length;
    const meanBy = (fn) => p.reduce((a, x) => a + fn(x), 0) / p.length;
    return {
      n: p.length,
      meanAcceptance: mean('acceptanceRate'),
      meanAccuracy: mean('accuracy'),
      meanSensitivity: mean('confidenceSensitivity'),
      meanRT: Math.round(meanBy((x) => x.medianRT)),
      acceptHigh: mean('acceptHigh'),
      acceptLow: mean('acceptLow'),
    };
  }

  return { N, participants, summary };
})();
