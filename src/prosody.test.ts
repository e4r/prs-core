// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { computeProsodicContour } from './prosody';

// Root frequency used across the tests, in Hz
const ROOT_HZ = 220;

// Δx of a just perfect fifth 3:2, in octaves
const FIFTH_OCTAVES = Math.log2(3 / 2);

describe('computeProsodicContour', () => {
  it('returns an empty contour for an empty scale', () => {
    expect(computeProsodicContour([], ROOT_HZ)).toEqual([]);
  });

  it('returns one resolution per degree, in order', () => {
    const contour = computeProsodicContour([0, FIFTH_OCTAVES, 1], ROOT_HZ);
    expect(contour).toHaveLength(3);
  });

  it('keeps the tonic and the octave at rest', () => {
    const [tonic, , octave] = computeProsodicContour([0, FIFTH_OCTAVES, 1], ROOT_HZ);
    expect(tonic.direction).toBe(0);
    expect(octave.direction).toBe(0);
  });

  it('resolves a slightly flat fifth upward and a slightly sharp one downward', () => {
    // Offset of 20 cents, in octaves
    const offset = 20 / 1200;
    const [flat, sharp] = computeProsodicContour([FIFTH_OCTAVES - offset, FIFTH_OCTAVES + offset], ROOT_HZ);
    expect(flat.direction).toBe(1);
    expect(sharp.direction).toBe(-1);
  });

  it('releases dissonance when resolving and never reports negative tension', () => {
    const contour = computeProsodicContour([0.05, 0.2, 0.37, 0.58, 0.9], ROOT_HZ);
    for (const degree of contour) {
      expect(degree.tensionReleased).toBeGreaterThanOrEqual(0);
      expect(degree.urgency).toBeGreaterThanOrEqual(0);
      expect(degree.distanceCents).toBeGreaterThanOrEqual(0);
    }
  });

  it('is more urgent off a minimum than on it', () => {
    const [onFifth, offFifth] = computeProsodicContour([FIFTH_OCTAVES, FIFTH_OCTAVES + 30 / 1200], ROOT_HZ);
    expect(offFifth.urgency).toBeGreaterThan(onFifth.urgency);
  });

  it('rejects an invalid base frequency or a non-finite Δx', () => {
    expect(() => computeProsodicContour([0], 0)).toThrow(RangeError);
    expect(() => computeProsodicContour([0], -440)).toThrow(RangeError);
    expect(() => computeProsodicContour([NaN], ROOT_HZ)).toThrow(RangeError);
  });
});
