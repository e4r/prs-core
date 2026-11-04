// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateEquivalencePeriodScale } from './sequences';

const PHI = (1 + Math.sqrt(5)) / 2;

describe('generateEquivalencePeriodScale', () => {
  it('reproduces 12-TET for period 2 and 12 steps', () => {
    const scale = generateEquivalencePeriodScale(440, 2, 12);
    expect(scale).toHaveLength(13);
    expect(scale[0]).toEqual({ frequencyHz: 440, stepIndex: 0, ratioToRoot: 1 });
    expect(scale[7].frequencyHz).toBeCloseTo(440 * Math.pow(2, 7 / 12), 10); // equal-tempered fifth ≈ 659.26 Hz
    expect(scale[12].frequencyHz).toBeCloseTo(880, 10);
  });

  it('closes on exactly one period above the root, for any period', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 4000, noNaN: true }),
        fc.double({ min: 1.01, max: 16, noNaN: true }),
        fc.integer({ min: 1, max: 64 }),
        (root, period, steps) => {
          const scale = generateEquivalencePeriodScale(root, period, steps);
          expect(scale).toHaveLength(steps + 1);
          expect(scale[steps].ratioToRoot).toBeCloseTo(period, 9);
          expect(scale[steps].frequencyHz).toBeCloseTo(root * period, 6);
        },
      ),
    );
  });

  it('is strictly increasing for a period above 1', () => {
    const scale = generateEquivalencePeriodScale(220, PHI, 7);
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i].frequencyHz).toBeGreaterThan(scale[i - 1].frequencyHz);
    }
  });

  it('supports an irrational period (golden ratio EDO)', () => {
    const scale = generateEquivalencePeriodScale(1, PHI, 7);
    expect(scale[0].ratioToRoot).toBeCloseTo(1);
    expect(scale[7].ratioToRoot).toBeCloseTo(PHI);
  });

  it('numbers steps from 0', () => {
    expect(generateEquivalencePeriodScale(100, 2, 3).map((s) => s.stepIndex)).toEqual([0, 1, 2, 3]);
  });

  it.each([
    [0, 2, 12],
    [-1, 2, 12],
    [Number.NaN, 2, 12],
    [440, 0, 12],
    [440, -2, 12],
    [440, Number.POSITIVE_INFINITY, 12],
    [440, 2, 0],
    [440, 2, -3],
    [440, 2, 2.5],
    [440, 2, Number.NaN],
  ])('rejects (root=%s, period=%s, steps=%s)', (root, period, steps) => {
    expect(() => generateEquivalencePeriodScale(root, period, steps)).toThrow(RangeError);
  });
});
