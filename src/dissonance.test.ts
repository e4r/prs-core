// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  criticalBandwidth,
  plompLevelt,
  harmonicDissonance,
  ratioDissonance,
  rankByDissonance,
  chordDissonance,
} from './dissonance';

describe('criticalBandwidth', () => {
  it('follows CBW(f) = 1.72 · f^0.65', () => {
    expect(criticalBandwidth(1)).toBeCloseTo(1.72, 10);
    expect(criticalBandwidth(440)).toBeCloseTo(1.72 * Math.pow(440, 0.65), 10);
  });

  it('grows monotonically with frequency', () => {
    expect(criticalBandwidth(880)).toBeGreaterThan(criticalBandwidth(440));
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (f) => {
    expect(() => criticalBandwidth(f)).toThrow(RangeError);
  });
});

describe('plompLevelt', () => {
  it('is zero for a unison', () => {
    expect(plompLevelt(440, 440, 1, 1)).toBeCloseTo(0, 12);
  });

  it('is symmetric in its two tones', () => {
    expect(plompLevelt(440, 460, 0.7, 0.4)).toBeCloseTo(plompLevelt(460, 440, 0.4, 0.7), 12);
  });

  it('scales with the product of the amplitudes', () => {
    const unit = plompLevelt(440, 460, 1, 1);
    expect(plompLevelt(440, 460, 0.5, 0.5)).toBeCloseTo(unit * 0.25, 12);
    expect(plompLevelt(440, 460, 0, 1)).toBe(0);
  });

  it('rises from the unison to a single maximum, then decays to zero far beyond the critical band', () => {
    const f = 440;
    const cbw = criticalBandwidth(f);
    const samples = Array.from({ length: 2000 }, (_, i) => plompLevelt(f, f + (i * cbw) / 500, 1, 1));
    const peakIndex = samples.indexOf(Math.max(...samples));
    expect(peakIndex).toBeGreaterThan(0);
    for (let i = 1; i <= peakIndex; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    for (let i = peakIndex + 1; i < samples.length; i++) expect(samples[i]).toBeLessThanOrEqual(samples[i - 1]);
    expect(plompLevelt(f, f + 10 * cbw, 1, 1)).toBeLessThan(1e-6);
  });

  // KNOWN DISCREPANCY (see CHANGELOG "Known issues"): the docs say the curve peaks at
  // Δf ≈ 0.25 · CBW, but x = Δf / (0.25 · CBW) with decay constants 3.5 / 5.75 puts the
  // maximum at ≈ 0.055 · CBW. `it.fails` keeps this visible: when the model is corrected
  // (or the documentation changed) this test starts passing and Vitest will flag it.
  it.fails('peaks at 0.25 · CBW as documented', () => {
    const f = 440;
    const cbw = criticalBandwidth(f);
    let bestDelta = 0;
    let best = -1;
    for (let delta = 0.01; delta < cbw; delta += 0.01) {
      const value = plompLevelt(f, f + delta, 1, 1);
      if (value > best) {
        best = value;
        bestDelta = delta;
      }
    }
    expect(bestDelta / cbw).toBeCloseTo(0.25, 1);
  });

  it('is never negative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 20, max: 8000, noNaN: true }),
        fc.double({ min: 20, max: 8000, noNaN: true }),
        (a, b) => plompLevelt(a, b, 1, 1) >= 0,
      ),
    );
  });

  it.each([
    [0, 440, 1, 1],
    [-440, 440, 1, 1],
    [Number.NaN, 440, 1, 1],
    [440, 440, -1, 1],
    [440, 440, 1, Number.NaN],
    [440, 440, Number.POSITIVE_INFINITY, 1],
  ])('rejects (%s, %s, %s, %s)', (f1, f2, a1, a2) => {
    expect(() => plompLevelt(f1, f2, a1, a2)).toThrow(RangeError);
  });
});

describe('harmonicDissonance', () => {
  it('ranks the octave and fifth below the tritone and minor second', () => {
    const octave = harmonicDissonance(220, 440);
    const fifth = harmonicDissonance(220, 330);
    const tritone = harmonicDissonance(220, 220 * Math.SQRT2);
    const minorSecond = harmonicDissonance(220, 220 * Math.pow(2, 1 / 12));
    expect(octave).toBeLessThan(tritone);
    expect(fifth).toBeLessThan(tritone);
    expect(fifth).toBeLessThan(minorSecond);
  });

  it('is symmetric', () => {
    expect(harmonicDissonance(220, 330)).toBeCloseTo(harmonicDissonance(330, 220), 12);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects harmonics = %s', (harmonics) => {
    expect(() => harmonicDissonance(220, 330, harmonics)).toThrow(RangeError);
  });

  it('rejects invalid frequencies', () => {
    expect(() => harmonicDissonance(0, 330)).toThrow(RangeError);
    expect(() => harmonicDissonance(220, -330)).toThrow(RangeError);
  });
});

describe('ratioDissonance / rankByDissonance', () => {
  it('matches harmonicDissonance on the derived frequency', () => {
    expect(ratioDissonance(220, { p: 3, q: 2 })).toBeCloseTo(harmonicDissonance(220, 330), 12);
  });

  it('ranks consonant ratios first, without mutating the input', () => {
    const ratios = [
      { p: 16, q: 15 },
      { p: 3, q: 2 },
      { p: 2, q: 1 },
      { p: 45, q: 32 },
    ];
    const snapshot = ratios.map((r) => ({ ...r }));
    const ranked = rankByDissonance(220, ratios);
    expect(ratios).toEqual(snapshot);
    expect(ranked).toHaveLength(4);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].dissonance).toBeGreaterThanOrEqual(ranked[i - 1].dissonance);
    }
    // The semitone-like 16:15 is the roughest of the four
    expect(ranked.at(-1)?.ratio).toEqual({ p: 16, q: 15 });
  });

  it('rejects an invalid ratio', () => {
    expect(() => ratioDissonance(220, { p: 1, q: 0 })).toThrow(RangeError);
  });
});

describe('chordDissonance', () => {
  it('is 0 for fewer than two voices', () => {
    expect(chordDissonance([])).toBe(0);
    expect(chordDissonance([440])).toBe(0);
  });

  it('equals the dyad dissonance for two voices', () => {
    expect(chordDissonance([220, 330])).toBeCloseTo(harmonicDissonance(220, 330), 12);
  });

  it('does not depend on voice order', () => {
    expect(chordDissonance([220, 275, 330])).toBeCloseTo(chordDissonance([330, 220, 275]), 12);
  });

  it('rates a just major triad as more consonant than a cluster', () => {
    expect(chordDissonance([220, 275, 330])).toBeLessThan(chordDissonance([220, 233, 247]));
  });

  it('validates even a single voice', () => {
    expect(() => chordDissonance([0])).toThrow(RangeError);
    expect(() => chordDissonance([220, 330], 0)).toThrow(RangeError);
  });
});
