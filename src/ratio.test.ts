// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createRatio,
  ratioFromString,
  simplifyRatio,
  multiplyRatios,
  divideRatios,
  invertRatio,
  ratiosEqual,
  ratioToDecimal,
  frequencyFromRatio,
  frequenciesFromRatios,
  ratiosFromPhases,
  ratioToString,
} from './ratio';

// Positive integers small enough that products stay inside the safe integer range
const component = fc.integer({ min: 1, max: 10_000 });
const ratio = fc.record({ p: component, q: component });

describe('createRatio / ratioFromString', () => {
  it('creates a ratio from positive integers', () => {
    expect(createRatio(3, 2)).toEqual({ p: 3, q: 2 });
  });

  it.each([
    [0, 1],
    [1, 0],
    [-1, 2],
    [1.5, 2],
    [Number.NaN, 2],
    [Number.POSITIVE_INFINITY, 2],
    [Number.MAX_SAFE_INTEGER + 2, 1],
  ])('rejects %s:%s', (p, q) => {
    expect(() => createRatio(p, q)).toThrow(RangeError);
  });

  it('parses "p:q" strings', () => {
    expect(ratioFromString('3:2')).toEqual({ p: 3, q: 2 });
    expect(ratioFromString(' 5 : 4 ')).toEqual({ p: 5, q: 4 });
  });

  it.each(['3', '3:2:1', '', ':', '3:', ':2'])('rejects malformed string %j with SyntaxError', (input) => {
    expect(() => ratioFromString(input)).toThrow(SyntaxError);
  });

  it.each(['a:b', '0:1', '-3:2', '1.5:2'])('rejects non-positive-integer components in %j', (input) => {
    expect(() => ratioFromString(input)).toThrow(RangeError);
  });

  it('round-trips through ratioToString', () => {
    fc.assert(
      fc.property(ratio, (r) => {
        expect(ratioFromString(ratioToString(r))).toEqual(r);
      }),
    );
  });
});

describe('simplifyRatio', () => {
  it('reduces to lowest terms', () => {
    expect(simplifyRatio({ p: 6, q: 4 })).toEqual({ p: 3, q: 2 });
    expect(simplifyRatio({ p: 7, q: 7 })).toEqual({ p: 1, q: 1 });
  });

  it('is idempotent and preserves the decimal value', () => {
    fc.assert(
      fc.property(ratio, (r) => {
        const once = simplifyRatio(r);
        expect(simplifyRatio(once)).toEqual(once);
        expect(ratioToDecimal(once)).toBeCloseTo(ratioToDecimal(r), 12);
      }),
    );
  });

  it('rejects invalid input', () => {
    expect(() => simplifyRatio({ p: 0, q: 1 })).toThrow(RangeError);
  });
});

describe('arithmetic', () => {
  it('stacks a fifth and a fourth into an octave', () => {
    expect(multiplyRatios({ p: 3, q: 2 }, { p: 4, q: 3 })).toEqual({ p: 2, q: 1 });
  });

  it('divides a fifth by a major third', () => {
    expect(divideRatios({ p: 3, q: 2 }, { p: 5, q: 4 })).toEqual({ p: 6, q: 5 });
  });

  it('inverts a fifth into a fourth-shaped ratio', () => {
    expect(invertRatio({ p: 3, q: 2 })).toEqual({ p: 2, q: 3 });
  });

  it('invertRatio is an involution', () => {
    fc.assert(
      fc.property(ratio, (r) => {
        expect(invertRatio(invertRatio(r))).toEqual(r);
      }),
    );
  });

  it('r ÷ r = 1:1 and r × invert(r) = 1:1', () => {
    fc.assert(
      fc.property(ratio, (r) => {
        expect(divideRatios(r, r)).toEqual({ p: 1, q: 1 });
        expect(multiplyRatios(r, invertRatio(r))).toEqual({ p: 1, q: 1 });
      }),
    );
  });

  it('multiplication is commutative', () => {
    fc.assert(
      fc.property(ratio, ratio, (a, b) => {
        expect(multiplyRatios(a, b)).toEqual(multiplyRatios(b, a));
      }),
    );
  });

  it('throws instead of silently losing precision on overflow', () => {
    const big = { p: 2 ** 40, q: 1 };
    expect(() => multiplyRatios(big, big)).toThrow(RangeError);
  });
});

describe('ratiosEqual / ratioToDecimal', () => {
  it('treats unsimplified ratios as equal', () => {
    expect(ratiosEqual({ p: 6, q: 4 }, { p: 3, q: 2 })).toBe(true);
    expect(ratiosEqual({ p: 3, q: 2 }, { p: 5, q: 4 })).toBe(false);
  });

  it('converts to decimal', () => {
    expect(ratioToDecimal({ p: 3, q: 2 })).toBe(1.5);
  });
});

describe('frequency derivation', () => {
  it('derives a perfect fifth above 220 Hz', () => {
    expect(frequencyFromRatio(220, { p: 3, q: 2 })).toBeCloseTo(330);
  });

  it('puts the root first', () => {
    expect(
      frequenciesFromRatios(220, [
        { p: 3, q: 2 },
        { p: 5, q: 2 },
      ]),
    ).toEqual([220, 330, 550]);
    expect(frequenciesFromRatios(220, [])).toEqual([220]);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects root %s', (root) => {
    expect(() => frequencyFromRatio(root, { p: 3, q: 2 })).toThrow(RangeError);
    expect(() => frequenciesFromRatios(root, [{ p: 3, q: 2 }])).toThrow(RangeError);
  });

  it('rejects an invalid ratio', () => {
    expect(() => frequencyFromRatio(220, { p: 3, q: 0 })).toThrow(RangeError);
  });
});

describe('ratiosFromPhases', () => {
  it('simplifies each phase against the shared base', () => {
    expect(ratiosFromPhases([3, 5, 8], 2)).toEqual([
      { p: 3, q: 2 },
      { p: 5, q: 2 },
      { p: 4, q: 1 },
    ]);
  });

  it('rejects an invalid base or phase', () => {
    expect(() => ratiosFromPhases([1], 0)).toThrow(RangeError);
    expect(() => ratiosFromPhases([1], 1.5)).toThrow(RangeError);
    expect(() => ratiosFromPhases([0], 2)).toThrow(RangeError);
  });
});
