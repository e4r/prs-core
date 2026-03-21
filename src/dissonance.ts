// Plomp-Levelt (1965) psychoacoustic dissonance model

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

// ─── Core model ──────────────────────────────────────────────────────────────

/**
 * Critical bandwidth of the human ear centred near a given frequency.
 * This is the frequency range within which two sinusoids interact and
 * produce roughness / beating. Outside this band they are heard as
 * independent — no dissonance contribution.
 *
 * Approximation: CBW(f) = 1.72 · f^0.65  (Moore & Glasberg 1983)
 *
 * @param {number} frequencyHz — centre frequency in Hz (must be > 0)
 * @returns {number} — critical bandwidth in Hz
 */
export function criticalBandwidth(frequencyHz: number) {
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
 * @param {number} f1Hz — frequency of first sinusoid in Hz
 * @param {number} f2Hz — frequency of second sinusoid in Hz
 * @param {number} amplitude1 — amplitude of first sinusoid (0–1)
 * @param {number} amplitude2 — amplitude of second sinusoid (0–1)
 * @returns {number} — dissonance value ≥ 0 (higher = more dissonant)
 */
export function plompLevelt(f1Hz: number, f2Hz: number, amplitude1: number, amplitude2: number): number {
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
 * @param {number} f1Hz — fundamental of first tone in Hz
 * @param {number} f2Hz — fundamental of second tone in Hz
 * @param {number} [harmonics=6] — number of partials to include per tone
 * @returns {number} — total dissonance (higher = more dissonant)
 */
export function harmonicDissonance(f1Hz: number, f2Hz: number, harmonics: number = DEFAULT_HARMONICS): number {
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
 * @param {number} rootHz — fundamental frequency in Hz
 * @param {{ p: number, q: number }} ratio — phase ratio of the voice
 * @param {number} [harmonics=6]
 * @returns {number} — dissonance value
 */
export function ratioDissonance(rootHz: number, { p, q }: { p: number, q: number }, harmonics: number = DEFAULT_HARMONICS): number {
  const voiceHz = rootHz * (p / q);
  return harmonicDissonance(rootHz, voiceHz, harmonics);
}

/**
 * Rank an array of ratios by dissonance against a root, ascending
 * (most consonant first).
 *
 * @param {number} rootHz
 * @param {Array<{ p: number, q: number }>} ratios
 * @param {number} [harmonics=6]
 * @returns {Array<{ ratio: { p: number, q: number }, dissonance: number }>}
 */
export function rankByDissonance(rootHz: number, ratios: Array<{ p: number, q: number }>, harmonics: number = DEFAULT_HARMONICS): Array<{ ratio: { p: number, q: number }, dissonance: number }> {
  return ratios
    .map(ratio => ({ ratio, dissonance: ratioDissonance(rootHz, ratio, harmonics) }))
    .sort((a, b) => a.dissonance - b.dissonance);
}

/**
 * Dissonance of a chord — sum of all pairwise harmonic dissonances between
 * the frequencies in the chord. Order does not matter.
 *
 * @param {number[]} frequenciesHz — array of voice frequencies in Hz
 * @param {number} [harmonics=6]
 * @returns {number} — total chord dissonance
 */
export function chordDissonance(frequenciesHz: number[], harmonics: number = DEFAULT_HARMONICS): number {
  let total = 0;
  for (let i = 0; i < frequenciesHz.length; i++) {
    for (let j = i + 1; j < frequenciesHz.length; j++) {
      total += harmonicDissonance(frequenciesHz[i], frequenciesHz[j], harmonics);
    }
  }
  return total;
}
