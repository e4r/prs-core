import { describe, it, expect } from 'vitest';
import { computeFrequency, buildChord, buildScale } from './ratio';
import { pureToneDissonance, complexToneDissonance, chordConsonance } from './dissonance';
import { fibonacci, primes, lucas, phiEDO, PHI } from './sequences';

describe('ratio', () => {
  it('computes perfect fifth from root 220', () => {
    expect(computeFrequency(220, 2, 3)).toBeCloseTo(330);
  });

  it('builds a chord from base and voices', () => {
    const chord = buildChord(220, 2, [3, 5]);
    expect(chord[0]).toBeCloseTo(330);  // 3:2 — perfect fifth
    expect(chord[1]).toBeCloseTo(550);  // 5:2
  });

  it('throws on invalid input', () => {
    expect(() => computeFrequency(-1, 2, 3)).toThrow();
    expect(() => buildChord(220, 0, [1])).toThrow();
  });
});

describe('dissonance', () => {
  it('unison has zero dissonance', () => {
    expect(pureToneDissonance(440, 440)).toBeCloseTo(0);
  });

  it('octave is more consonant than tritone', () => {
    const octave = complexToneDissonance(220, 440);
    const tritone = complexToneDissonance(220, 311); // ~tritone
    expect(octave).toBeLessThan(tritone);
  });

  it('chordConsonance returns 100 for single frequency', () => {
    expect(chordConsonance([440])).toBe(100);
  });

  it('octave dyad scores higher than tritone dyad', () => {
    const octaveScore = chordConsonance([220, 440]);
    const tritoneScore = chordConsonance([220, 311]);
    expect(octaveScore).toBeGreaterThan(tritoneScore);
  });
});

describe('sequences', () => {
  it('fibonacci starts correctly', () => {
    expect(fibonacci(7)).toEqual([1, 1, 2, 3, 5, 8, 13]);
  });

  it('first 5 primes', () => {
    expect(primes(5)).toEqual([2, 3, 5, 7, 11]);
  });

  it('lucas starts with [2, 1]', () => {
    expect(lucas(4)).toEqual([2, 1, 3, 4]);
  });

  it('phiEDO step 0 is 1 and step n is phi', () => {
    const scale = phiEDO(7);
    expect(scale[0]).toBeCloseTo(1);
    expect(scale[7]).toBeCloseTo(PHI);
  });
});
