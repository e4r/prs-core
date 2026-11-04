// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

// Scale generation from an equivalence period (generalised EDO)

/** One degree of an equivalence-period scale. */
export interface ScaleStep {
  /** Frequency of the step in Hz. */
  frequencyHz: number;
  /** Index of the step, 0 (the root) … steps (one full period above the root). */
  stepIndex: number;
  /** Frequency ratio of the step relative to the root (1 for the root, `period` for the last step). */
  ratioToRoot: number;
}

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
 * @param rootHz — fundamental frequency in Hz (finite, > 0)
 * @param period — repetition ratio (finite, > 0; e.g. 2 = octave)
 * @param steps — number of scale steps N (positive integer)
 * @returns the scale steps; length is always `steps + 1`
 * @throws {RangeError} if `rootHz` or `period` is not a positive finite number, or `steps` is not a positive integer
 * @example
 * // 12-tone equal temperament from A3
 * generateEquivalencePeriodScale(220, 2, 12);
 * @example
 * // Golden-ratio EDO with 7 steps per period
 * generateEquivalencePeriodScale(220, (1 + Math.sqrt(5)) / 2, 7);
 */
export function generateEquivalencePeriodScale(rootHz: number, period: number, steps: number): ScaleStep[] {
  if (!Number.isFinite(rootHz) || rootHz <= 0) {
    throw new RangeError(`rootHz must be a positive number of Hz; got ${rootHz}`);
  }
  if (!Number.isFinite(period) || period <= 0) {
    throw new RangeError(`period must be a positive finite number; got ${period}`);
  }
  if (!Number.isSafeInteger(steps) || steps < 1) {
    throw new RangeError(`steps must be a positive integer; got ${steps}`);
  }
  const scale: ScaleStep[] = [];
  // Loop to i <= steps so the closing note (i = steps → ratio = period) is included
  for (let i = 0; i <= steps; i++) {
    // Ratio of this step to the root — never an integer fraction for irrational periods
    const ratioToRoot = Math.pow(period, i / steps);
    const frequencyHz = rootHz * ratioToRoot;
    scale.push({ frequencyHz, stepIndex: i, ratioToRoot });
  }
  return scale;
}
