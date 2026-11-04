// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

// Plomp-Levelt (1965) psychoacoustic dissonance model

import { frequencyFromRatio, type Ratio } from './ratio';

// ─── Constants ───────────────────────────────────────────────────────────────

// Exponent in the critical bandwidth approximation (Moore & Glasberg 1983)
const CRITICAL_BANDWIDTH_EXPONENT = 0.65;

// Coefficient in the critical bandwidth approximation
const CRITICAL_BANDWIDTH_COEFFICIENT = 1.72;

// The fraction of CBW at which dissonance peaks (Plomp-Levelt curve parameter)
const PEAK_FRACTION_OF_CBW = 0.25;

// Decay constants for the two exponential terms in the Plomp-Levelt curve.
// The curve is: d(x) = exp(-DECAY_FAST · x) − exp(-DECAY_SLOW · x)
// where x = Δf / (PEAK_FRACTION_OF_CBW · CBW).
// These values reproduce the original Plomp-Levelt (1965) figure 5 curve.
const DECAY_FAST = 3.5;
const DECAY_SLOW = 5.75;

// Number of harmonics to model per tone when computing harmonic dissonance.
// 6 captures the perceptually relevant region without excessive computation.
const DEFAULT_HARMONICS = 6;

function requireHarmonics(harmonics: number): void {
  if (!Number.isSafeInteger(harmonics) || harmonics < 1) {
    throw new RangeError(`harmonics must be a positive integer; got ${harmonics}`);
  }
}

// ─── Core model ──────────────────────────────────────────────────────────────

/**
 * Critical bandwidth of the human ear centred near a given frequency.
 * This is the frequency range within which two sinusoids interact and
 * produce roughness / beating. Outside this band they are heard as
 * independent — no dissonance contribution.
 *
 * Approximation: CBW(f) = 1.72 · f^0.65  (Moore & Glasberg 1983)
 *
 * @param frequencyHz — centre frequency in Hz (must be a positive finite number)
 * @returns critical bandwidth in Hz
 * @throws {RangeError} if `frequencyHz` is not a positive finite number
 * @example
 * criticalBandwidth(440); // ≈ 91.3
 */
export function criticalBandwidth(frequencyHz: number): number {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new RangeError(`frequencyHz must be a positive finite number of Hz; got ${frequencyHz}`);
  }
  return CRITICAL_BANDWIDTH_COEFFICIENT * Math.pow(frequencyHz, CRITICAL_BANDWIDTH_EXPONENT);
}

/**
 * Dissonance between two pure sinusoids, per the Plomp-Levelt (1965) model.
 *
 * The model encodes the empirical observation that roughness between two
 * tones depends on their frequency difference relative to the critical
 * bandwidth at their centre frequency:
 *   — zero dissonance when Δf = 0 (unison) or Δf >> CBW
 *   — maximum dissonance near Δf ≈ 0.25 · CBW
 *
 * The curve is: d(x) = exp(-DECAY_FAST · x) − exp(-DECAY_SLOW · x)
 * where x = Δf / (PEAK_FRACTION_OF_CBW · CBW)
 * Scaled by the product of the two amplitudes.
 *
 * @param f1Hz — frequency of first sinusoid in Hz (> 0)
 * @param f2Hz — frequency of second sinusoid in Hz (> 0)
 * @param amplitude1 — amplitude of first sinusoid (finite, ≥ 0; conventionally 0–1)
 * @param amplitude2 — amplitude of second sinusoid (finite, ≥ 0; conventionally 0–1)
 * @returns dissonance value ≥ 0 (higher = more dissonant)
 * @throws {RangeError} if a frequency is not positive and finite, or an amplitude is negative or not finite
 * @example
 * plompLevelt(440, 440, 1, 1); // 0 — unison
 */
export function plompLevelt(f1Hz: number, f2Hz: number, amplitude1: number, amplitude2: number): number {
  if (!Number.isFinite(amplitude1) || amplitude1 < 0 || !Number.isFinite(amplitude2) || amplitude2 < 0) {
    throw new RangeError(`Amplitudes must be finite numbers ≥ 0; got ${amplitude1} and ${amplitude2}`);
  }
  const deltaF = Math.abs(f2Hz - f1Hz);
  const cbw = criticalBandwidth(Math.min(f1Hz, f2Hz));
  const x = deltaF / (PEAK_FRACTION_OF_CBW * cbw);
  const curve = Math.exp(-DECAY_FAST * x) - Math.exp(-DECAY_SLOW * x);
  // curve can go slightly negative beyond the second zero-crossing; clamp it.
  return Math.max(0, curve) * amplitude1 * amplitude2;
}

// ─── Harmonic extension ───────────────────────────────────────────────────────

/**
 * Total psychoacoustic dissonance between two complex tones at f1 and f2.
 *
 * Each tone is modelled as a harmonic series up to `harmonics` partials.
 * The n-th partial has amplitude 1/n (natural rolloff of a harmonic series).
 * Every pair of partials (one from each tone) contributes to the total.
 *
 * This is the standard extension of the Plomp-Levelt model to complex tones
 * and gives a dissonance curve over intervals that matches perceived consonance
 * rankings: octave (2:1) and fifth (3:2) at the minima, tritone near the peak.
 *
 * @param f1Hz — fundamental of first tone in Hz (> 0)
 * @param f2Hz — fundamental of second tone in Hz (> 0)
 * @param harmonics — number of partials to include per tone (positive integer, default 6)
 * @returns total dissonance (higher = more dissonant)
 * @throws {RangeError} if a frequency is invalid or `harmonics` is not a positive integer
 * @example
 * harmonicDissonance(220, 440) < harmonicDissonance(220, 311); // true — octave beats tritone
 */
export function harmonicDissonance(f1Hz: number, f2Hz: number, harmonics: number = DEFAULT_HARMONICS): number {
  requireHarmonics(harmonics);
  let total = 0;
  for (let n = 1; n <= harmonics; n++) {
    for (let m = 1; m <= harmonics; m++) {
      total += plompLevelt(n * f1Hz, m * f2Hz, 1 / n, 1 / m);
    }
  }
  return total;
}

// ─── Ratio convenience wrappers ───────────────────────────────────────────────

/**
 * Dissonance produced by a single ratio interval applied to a root frequency.
 * This is the primary entry point when working with phase ratios.
 *
 * @param rootHz — fundamental frequency in Hz (> 0)
 * @param ratio — phase ratio of the voice
 * @param harmonics — partials per tone (positive integer, default 6)
 * @returns dissonance value
 * @throws {RangeError} if the root, ratio or `harmonics` is invalid
 * @example
 * ratioDissonance(220, { p: 3, q: 2 }); // low — a perfect fifth
 */
export function ratioDissonance(rootHz: number, ratio: Ratio, harmonics: number = DEFAULT_HARMONICS): number {
  const voiceHz = frequencyFromRatio(rootHz, ratio);
  return harmonicDissonance(rootHz, voiceHz, harmonics);
}

/**
 * Rank an array of ratios by dissonance against a root, ascending
 * (most consonant first).
 *
 * @param rootHz — fundamental frequency in Hz (> 0)
 * @param ratios — candidate ratios (the input array is not modified)
 * @param harmonics — partials per tone (positive integer, default 6)
 * @returns `{ ratio, dissonance }` entries, most consonant first
 * @throws {RangeError} if the root, a ratio or `harmonics` is invalid
 */
export function rankByDissonance(
  rootHz: number,
  ratios: readonly Ratio[],
  harmonics: number = DEFAULT_HARMONICS,
): Array<{ ratio: Ratio; dissonance: number }> {
  return ratios
    .map((ratio) => ({ ratio, dissonance: ratioDissonance(rootHz, ratio, harmonics) }))
    .sort((a, b) => a.dissonance - b.dissonance);
}

/**
 * Dissonance of a chord — sum of all pairwise harmonic dissonances between
 * the frequencies in the chord. Order does not matter.
 *
 * @param frequenciesHz — voice frequencies in Hz (each > 0)
 * @param harmonics — partials per tone (positive integer, default 6)
 * @returns total chord dissonance (0 for fewer than two voices)
 * @throws {RangeError} if a frequency or `harmonics` is invalid
 * @example
 * chordDissonance([220, 330, 440]);
 */
export function chordDissonance(frequenciesHz: readonly number[], harmonics: number = DEFAULT_HARMONICS): number {
  requireHarmonics(harmonics);
  frequenciesHz.forEach((frequency) => criticalBandwidth(frequency));
  let total = 0;
  for (let i = 0; i < frequenciesHz.length; i++) {
    for (let j = i + 1; j < frequenciesHz.length; j++) {
      total += harmonicDissonance(frequenciesHz[i], frequenciesHz[j], harmonics);
    }
  }
  return total;
}
