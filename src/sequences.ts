// Generates integer sequences (Fibonacci, primes, Lucas, etc.) for use as compositional primitives

// ─── Equivalence Period Scale ─────────────────────────────────────────────────

/**
 * Generate an equivalence-period scale.
 *
 * Formula: f(i) = rootHz × period^(i / steps), for i = 0 .. steps
 *
 * This generalises EDO (Equal Division of the Octave): when period = 2 and
 * steps = 12 the result is 12-tone equal temperament.  Any positive real
 * period is valid — including irrational values such as φ (golden ratio) or π.
 *
 * The closing note (i = steps) is always included: it equals rootHz × period,
 * i.e. exactly one period above the root.  A 7-step scale therefore yields
 * 8 voices — the 7 inner divisions plus the closing boundary tone.
 *
 * @param {number} rootHz  — fundamental frequency in Hz (must be > 0)
 * @param {number} period  — repetition ratio (must be > 0; e.g. 2 = octave)
 * @param {number} steps   — number of scale steps N (positive integer ≥ 1)
 * @returns {Array<{ frequencyHz: number, stepIndex: number, ratioToRoot: number }>}
 *          length is always steps + 1
 */
export function generateEquivalencePeriodScale(rootHz: number, period: number, steps: number) {
  const scale = [];
  // Loop to i <= steps so the closing note (i = steps → ratio = period) is included
  for (let i = 0; i <= steps; i++) {
    // Ratio of this step to the root — never an integer fraction for irrational periods
    const ratioToRoot = Math.pow(period, i / steps);
    const frequencyHz = rootHz * ratioToRoot;
    scale.push({ frequencyHz, stepIndex: i, ratioToRoot });
  }
  return scale;
}
