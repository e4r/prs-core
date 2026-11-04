// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

// Resolution: where each scale degree "wants" to go, from three ingredients —
// psychoacoustic stability, Lerdahl-style attraction, and a prosodic bias.
//
// Degrees are frequency ratios relative to the tonic (plain numbers, the same
// convention as `ratioToRoot` in sequences.ts: tonic = 1, octave = 2).

import { plompLevelt } from './dissonance';

// ─── Defaults ────────────────────────────────────────────────────────────────

/**
 * Default stability temperature τ in s(x) = exp(−D(x) / τ).
 * PROVISIONAL: not fitted to any data. Smaller τ sharpens the contrast between
 * stable and unstable degrees; larger τ flattens it.
 */
export const TAU = 1;

/**
 * Default prosodic strength β in b = 1 + β · phrasePos.
 * PROVISIONAL: not fitted to any data. 0 disables the prosodic term.
 */
export const BETA = 0.5;

/** Default tonic frequency in Hz (middle C, C4). */
export const F0 = 261.63;

/** A single partial of a timbre: frequency multiple of the fundamental and its amplitude. */
export interface TimbrePartial {
  /** Frequency of the partial as a multiple of the fundamental (1 = fundamental). */
  ratio: number;
  /** Amplitude of the partial (≥ 0). */
  amp: number;
}

/**
 * Default timbre: 6 harmonic partials with amplitude 1/n. Matches the
 * partial count and rolloff used by `harmonicDissonance` in dissonance.ts.
 */
export const DEFAULT_TIMBRE: ReadonlyArray<TimbrePartial> = Object.freeze(
  [1, 2, 3, 4, 5, 6].map((n) => Object.freeze({ ratio: n, amp: 1 / n })),
);

/**
 * Default context: the just major triad on the tonic, 4:5:6 → [1, 5/4, 3/2].
 * (For 12-TET pass [1, 2^(4/12), 2^(7/12)] explicitly.)
 */
export const DEFAULT_CONTEXT: ReadonlyArray<number> = Object.freeze([1, 5 / 4, 3 / 2]);

/**
 * Parameters shared by the resolution functions. Every field is optional and
 * falls back to the exported defaults.
 */
export interface ResolutionContext {
  /** Set of reference degrees (ratios to the tonic) that stability is measured against. Default: DEFAULT_CONTEXT. */
  context?: ReadonlyArray<number>;
  /** Timbre as a list of partials {ratio, amp}. Default: DEFAULT_TIMBRE. */
  timbre?: ReadonlyArray<TimbrePartial>;
  /** Tonic frequency in Hz (> 0), needed because Plomp-Levelt depends on absolute frequency. Default: F0. */
  f0?: number;
  /** Position in the phrase, 0 (start) … 1 (end). Default: 0. */
  phrasePos?: number;
  /** Stability temperature τ (> 0). Default: TAU (provisional). */
  tau?: number;
  /** Prosodic strength β. Default: BETA (provisional). */
  beta?: number;
}

// ─── Internals ───────────────────────────────────────────────────────────────

function requireDegree(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite ratio; got ${value}`);
  }
}

function requirePhrasePos(phrasePos: number): void {
  if (!Number.isFinite(phrasePos) || phrasePos < 0 || phrasePos > 1) {
    throw new RangeError(`phrasePos must be in [0, 1]; got ${phrasePos}`);
  }
}

interface ResolvedContext {
  context: ReadonlyArray<number>;
  timbre: ReadonlyArray<TimbrePartial>;
  f0: number;
  phrasePos: number;
  tau: number;
  beta: number;
}

// Fill defaults and validate once, so the hot paths can assume clean input
function resolveContext(ctx: ResolutionContext = {}): ResolvedContext {
  const { context = DEFAULT_CONTEXT, timbre = DEFAULT_TIMBRE, f0 = F0, phrasePos = 0, tau = TAU, beta = BETA } = ctx;

  if (context.length === 0) throw new RangeError('context must contain at least one degree');
  context.forEach((degree) => requireDegree(degree, 'context degree'));
  if (timbre.length === 0) throw new RangeError('timbre must contain at least one partial');
  timbre.forEach((partial) => {
    requireDegree(partial.ratio, 'partial ratio');
    if (!Number.isFinite(partial.amp) || partial.amp < 0) {
      throw new RangeError(`partial amp must be a finite number ≥ 0; got ${partial.amp}`);
    }
  });
  if (!Number.isFinite(f0) || f0 <= 0) throw new RangeError(`f0 must be a positive number of Hz; got ${f0}`);
  requirePhrasePos(phrasePos);
  if (!Number.isFinite(tau) || tau <= 0) throw new RangeError(`tau must be a positive number; got ${tau}`);
  if (!Number.isFinite(beta)) throw new RangeError(`beta must be finite; got ${beta}`);

  return { context, timbre, f0, phrasePos, tau, beta };
}

// D(x): Plomp-Levelt dissonance summed over every partial pair between the
// tone at x and each tone in the context (Sethares 1993 extension to timbres)
function totalDissonance(degree: number, c: ResolvedContext): number {
  const frequency = c.f0 * degree;
  let total = 0;
  for (const contextDegree of c.context) {
    const contextFrequency = c.f0 * contextDegree;
    for (const a of c.timbre) {
      for (const b of c.timbre) {
        total += plompLevelt(frequency * a.ratio, contextFrequency * b.ratio, a.amp, b.amp);
      }
    }
  }
  return total;
}

// Distance in (continuous) semitones between two ratios
function semitoneDistance(from: number, to: number): number {
  return Math.abs(1200 * Math.log2(to / from)) / 100;
}

// α with defaults already resolved and degrees already validated
function attractionResolved(from: number, to: number, c: ResolvedContext): number {
  if (from === to) return 0;
  const d = semitoneDistance(from, to);
  // s(y)/s(x) = exp(−D(y)/τ) / exp(−D(x)/τ) = exp((D(x) − D(y))/τ):
  // identical value, but cannot underflow to 0/0 when D/τ is large
  const stabilityRatio = Math.exp((totalDissonance(from, c) - totalDissonance(to, c)) / c.tau);
  return (stabilityRatio / (d * d)) * prosodicBias(from, to, c.phrasePos, c.beta);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Psychoacoustic stability of a scale degree against a context.
 *
 *   D(x) = Σ_{c ∈ context} Σ_{i,j ∈ partials} PL(f0·x·rᵢ, f0·c·rⱼ; aᵢ, aⱼ)
 *   s(x) = exp(−D(x) / τ)
 *
 * PL is the Plomp-Levelt (1965) pair dissonance (`plompLevelt`), summed over all
 * pairs of partials as in Sethares (1993, "Local consonance and the relationship
 * between timbre and scale"; see also Sethares, Tuning, Timbre, Spectrum, Scale).
 * exp is used instead of 1/D so that a degree coinciding with the context
 * (D = 0) gets s = 1 rather than infinity. s ∈ (0, 1]; higher = more stable.
 *
 * τ defaults to TAU = 1, which is PROVISIONAL and not fitted to data.
 *
 * @param {number} degree — frequency ratio relative to the tonic (> 0)
 * @param {ResolutionContext} [ctx] — context, timbre, f0, tau (others unused here)
 * @returns {number} — stability in (0, 1]
 */
export function stability(degree: number, ctx: ResolutionContext = {}): number {
  requireDegree(degree, 'degree');
  const c = resolveContext(ctx);
  return Math.exp(-totalDissonance(degree, c) / c.tau);
}

/**
 * Prosodic bias on a movement between two degrees (declination and final lowering).
 *
 *   b = 1 + β · phrasePos   if to < from  (descending)
 *   b = 1                   otherwise
 *
 * phrasePos runs from 0 (start of phrase) to 1 (end). β defaults to BETA = 0.5,
 * which is PROVISIONAL and not fitted to data.
 *
 * @param {number} from — starting degree (ratio to the tonic)
 * @param {number} to — target degree (ratio to the tonic)
 * @param {number} phrasePos — position in the phrase, in [0, 1]
 * @param {number} [beta=BETA] — prosodic strength
 * @returns {number} — multiplicative bias, 1 for ascending or level movement
 */
export function prosodicBias(from: number, to: number, phrasePos: number, beta: number = BETA): number {
  requireDegree(from, 'from');
  requireDegree(to, 'to');
  requirePhrasePos(phrasePos);
  if (!Number.isFinite(beta)) throw new RangeError(`beta must be finite; got ${beta}`);
  return to < from ? 1 + beta * phrasePos : 1;
}

/**
 * Attraction of degree `from` toward degree `to`.
 *
 * Structure follows Lerdahl, Tonal Pitch Space (2001), where attraction is the
 * ratio of the anchoring strengths of target and source divided by the squared
 * distance; here the tonal-hierarchy anchoring is replaced by the psychoacoustic
 * stability s of `stability`:
 *
 *   d = |1200 · log2(to / from)| / 100       (semitones, continuous)
 *   α(from → to) = (s(to) / s(from)) · 1/d² · b(from, to, phrasePos)
 *
 * with b from `prosodicBias`. α = 0 when from === to. The ratio s(to)/s(from) is
 * evaluated as exp((D(from) − D(to)) / τ), which is the same quantity but
 * numerically safe.
 *
 * @param {number} from — starting degree (ratio to the tonic)
 * @param {number} to — target degree (ratio to the tonic)
 * @param {ResolutionContext} [ctx] — context, timbre, f0, phrasePos, tau, beta
 * @returns {number} — attraction α ≥ 0 (higher = stronger pull)
 */
export function attraction(from: number, to: number, ctx: ResolutionContext = {}): number {
  requireDegree(from, 'from');
  requireDegree(to, 'to');
  return attractionResolved(from, to, resolveContext(ctx));
}

/**
 * Full attraction matrix of a scale: entry [i][j] = α(scale[i] → scale[j]).
 * N×N with a zero diagonal. Row i is "from", column j is "to".
 *
 * @param {number[]} scale — degrees as ratios to the tonic
 * @param {ResolutionContext} [ctx] — see `attraction`
 * @returns {number[][]} — N×N matrix
 */
export function attractionMatrix(scale: ReadonlyArray<number>, ctx: ResolutionContext = {}): number[][] {
  scale.forEach((degree) => requireDegree(degree, 'scale degree'));
  const c = resolveContext(ctx);
  return scale.map((from) => scale.map((to) => attractionResolved(from, to, c)));
}

/**
 * The degree of the scale that `from` is most strongly attracted to:
 * argmax over to ∈ scale, to ≠ from, of α(from → to). Ties go to the first
 * such degree in `scale`.
 *
 * @param {number} from — starting degree (ratio to the tonic)
 * @param {number[]} scale — candidate targets (ratios to the tonic)
 * @param {ResolutionContext} [ctx] — see `attraction`
 * @returns {{ to: number, alpha: number }} — best target and its attraction
 * @throws {RangeError} — if the scale has no degree other than `from`
 */
export function strongestTarget(
  from: number,
  scale: ReadonlyArray<number>,
  ctx: ResolutionContext = {},
): { to: number; alpha: number } {
  requireDegree(from, 'from');
  scale.forEach((degree) => requireDegree(degree, 'scale degree'));
  const c = resolveContext(ctx);

  let best: { to: number; alpha: number } | undefined;
  for (const to of scale) {
    if (to === from) continue;
    const alpha = attractionResolved(from, to, c);
    if (best === undefined || alpha > best.alpha) best = { to, alpha };
  }
  if (best === undefined) throw new RangeError('scale has no degree other than `from` to attract toward');
  return best;
}
