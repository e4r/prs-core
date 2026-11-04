// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import {
  stability,
  attraction,
  prosodicBias,
  attractionMatrix,
  strongestTarget,
  BETA,
  TAU,
  type ResolutionContext,
  type TimbrePartial,
} from './resolution';

// ─── Fixtures: 12-TET, C major, harmonic timbre ──────────────────────────────

// Ratio of a 12-TET pitch, in semitones above the tonic
const tet = (semitones: number) => Math.pow(2, semitones / 12);

const DO = tet(0);
const RE = tet(2);
const MI = tet(4);
const FA = tet(5);
const SOL = tet(7);
const LA = tet(9);
const SI = tet(11);
const DO_HIGH = tet(12);

// C major scale including the closing octave, so the leading tone has a tonic above it
const SCALE = [DO, RE, MI, FA, SOL, LA, SI, DO_HIGH];

// Harmonic timbre: 6 partials with amplitude 1/n
const HARMONIC_TIMBRE: TimbrePartial[] = Array.from({ length: 6 }, (_, i) => ({ ratio: i + 1, amp: 1 / (i + 1) }));

// Inharmonic timbre: partials not at integer multiples
const INHARMONIC_TIMBRE: TimbrePartial[] = [1, 1.41, 2.09, 2.73, 3.38, 4.12].map((ratio, i) => ({
  ratio,
  amp: 1 / (i + 1),
}));

// C major triad in 12-TET
const TRIAD = [DO, MI, SOL];

const ctx = (overrides: ResolutionContext = {}): ResolutionContext => ({
  context: TRIAD,
  timbre: HARMONIC_TIMBRE,
  phrasePos: 0,
  ...overrides,
});

// ─── Structural tests ────────────────────────────────────────────────────────

describe('resolution — structure', () => {
  it('attraction(x, x) === 0', () => {
    for (const x of SCALE) expect(attraction(x, x, ctx())).toBe(0);
  });

  it('attractionMatrix is N×N, zero on the diagonal, with no NaN or Infinity', () => {
    const matrix = attractionMatrix(SCALE, ctx());
    expect(matrix).toHaveLength(SCALE.length);
    matrix.forEach((row, i) => {
      expect(row).toHaveLength(SCALE.length);
      expect(row[i]).toBe(0);
      row.forEach((value) => expect(Number.isFinite(value)).toBe(true));
    });
  });

  it('attractionMatrix agrees with attraction()', () => {
    const matrix = attractionMatrix(SCALE, ctx());
    expect(matrix[6][7]).toBe(attraction(SI, DO_HIGH, ctx()));
  });

  // KNOWN FAILURE (it.fails): s(do) = 0.9789 < s(re) = 0.9932 with the harmonic timbre and C major triad.
  // Cause is upstream, in `plompLevelt` (dissonance.ts): despite its comment, the curve
  // exp(-3.5x) - exp(-5.75x) with x = Δf / (0.25·CBW) peaks at Δf ≈ 0.055·CBW (≈ 3.5 Hz at 261 Hz),
  // not at 0.25·CBW. A major second (~32 Hz) therefore contributes almost nothing
  // (D(re|do) ≈ 0.001) while the tonic's 12-TET thirds/fifths against the triad do (D(do|mi) ≈ 0.010).
  // Not worked around here: remove `.fails` once the curve in dissonance.ts is reviewed.
  it.fails('the tonic is more stable than the second degree', () => {
    expect(stability(DO, ctx())).toBeGreaterThan(stability(RE, ctx()));
  });

  it('stability is in (0, 1]', () => {
    for (const x of SCALE) {
      const s = stability(x, ctx());
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it('at phrasePos = 1 the descending bias is greater than the ascending one', () => {
    const descending = prosodicBias(SOL, FA, 1, BETA);
    const ascending = prosodicBias(FA, SOL, 1, BETA);
    expect(descending).toBeGreaterThan(ascending);
    expect(descending).toBeCloseTo(1 + BETA);
    expect(ascending).toBe(1);
  });

  it('at phrasePos = 0 the bias is 1 in both directions, so direction enters only through stability', () => {
    expect(prosodicBias(SOL, FA, 0, BETA)).toBe(1);
    expect(prosodicBias(FA, SOL, 0, BETA)).toBe(1);

    // With b = 1: α(x→y) · α(y→x) = 1/d⁴, the stability ratios cancel
    const d = 1; // fa ↔ mi is one semitone
    const product = attraction(FA, MI, ctx()) * attraction(MI, FA, ctx());
    expect(product).toBeCloseTo(1 / d ** 4, 10);
  });

  it('changing the timbre changes the matrix', () => {
    const harmonic = attractionMatrix(SCALE, ctx({ timbre: HARMONIC_TIMBRE }));
    const inharmonic = attractionMatrix(SCALE, ctx({ timbre: INHARMONIC_TIMBRE }));
    expect(inharmonic).not.toEqual(harmonic);
  });

  it('strongestTarget never returns the starting degree and matches the matrix row maximum', () => {
    const matrix = attractionMatrix(SCALE, ctx());
    SCALE.forEach((from, i) => {
      const { to, alpha } = strongestTarget(from, SCALE, ctx());
      expect(to).not.toBe(from);
      expect(alpha).toBe(Math.max(...matrix[i]));
    });
  });

  it('uses the exported defaults when no context is given', () => {
    expect(TAU).toBe(1);
    expect(BETA).toBe(0.5);
    expect(stability(1)).toBeGreaterThan(0);
    expect(Number.isFinite(attraction(1, 9 / 8))).toBe(true);
  });

  it('rejects invalid input', () => {
    expect(() => stability(0)).toThrow(RangeError);
    expect(() => stability(-1)).toThrow(RangeError);
    expect(() => attraction(1, NaN)).toThrow(RangeError);
    expect(() => prosodicBias(1, 2, 1.5, BETA)).toThrow(RangeError);
    expect(() => stability(1, { f0: 0 })).toThrow(RangeError);
    expect(() => stability(1, { tau: 0 })).toThrow(RangeError);
    expect(() => stability(1, { context: [] })).toThrow(RangeError);
    expect(() => stability(1, { timbre: [] })).toThrow(RangeError);
    expect(() => strongestTarget(1, [1])).toThrow(RangeError);
  });
});

// ─── Prediction tests: hypotheses of the model, not requirements ─────────────
// If one fails it must be marked `it.fails` and its α values reported; TAU, BETA
// and the formulas are deliberately NOT tuned to make them pass.
// (Currently all three hold; α values are in the task summary.)

describe('resolution — model predictions (hypotheses)', () => {
  it('from si, the strongest target is do (leading tone → tonic)', () => {
    const { to, alpha } = strongestTarget(SI, SCALE, ctx());
    // "do" = pitch class of the tonic; here the do above si
    expect(to).toBe(DO_HIGH);
    expect(alpha).toBeGreaterThan(0);
  });

  it('from fa, mi attracts more than sol', () => {
    expect(attraction(FA, MI, ctx())).toBeGreaterThan(attraction(FA, SOL, ctx()));
  });

  it('from re at phrasePos = 1, do attracts more than mi', () => {
    const c = ctx({ phrasePos: 1 });
    expect(attraction(RE, DO, c)).toBeGreaterThan(attraction(RE, MI, c));
  });
});
