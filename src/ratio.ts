// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

// Phase ratio math: creation, arithmetic, simplification, and frequency derivation

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A phase ratio p:q — for every q cycles of the fundamental, the voice
 * completes p cycles.
 */
export interface Ratio {
  /** Numerator: cycles of the voice. */
  p: number;
  /** Denominator: cycles of the fundamental. */
  q: number;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

// Euclidean GCD — used exclusively for ratio simplification (iterative: no stack growth)
function gcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer; got ${value}`);
  }
}

function requireRatio({ p, q }: Ratio): void {
  if (!Number.isSafeInteger(p) || !Number.isSafeInteger(q) || p <= 0 || q <= 0) {
    throw new RangeError(`Ratio components must be positive integers; got ${p}:${q}`);
  }
}

function requireFrequency(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number of Hz; got ${value}`);
  }
}

// ─── Construction ────────────────────────────────────────────────────────────

/**
 * Create a ratio object from two positive integers.
 * @param p — numerator (cycles of the voice)
 * @param q — denominator (cycles of the fundamental)
 * @returns the ratio `{ p, q }`
 * @throws {RangeError} if either component is not a positive safe integer
 * @example
 * createRatio(3, 2); // { p: 3, q: 2 }
 */
export function createRatio(p: number, q: number): Ratio {
  const ratio = { p, q };
  requireRatio(ratio);
  return ratio;
}

/**
 * Parse a "p:q" string into a ratio object.
 * @param str — e.g. "3:2"
 * @returns the parsed ratio
 * @throws {SyntaxError} if the string is not of the form "p:q"
 * @throws {RangeError} if p or q is not a positive integer
 * @example
 * ratioFromString('3:2'); // { p: 3, q: 2 }
 */
export function ratioFromString(str: string): Ratio {
  const parts = str.split(':');
  if (parts.length !== 2 || parts.some((part) => part.trim() === '')) {
    throw new SyntaxError(`Expected "p:q" format; got "${str}"`);
  }
  return createRatio(Number(parts[0]), Number(parts[1]));
}

// ─── Simplification ──────────────────────────────────────────────────────────

/**
 * Reduce a ratio to its lowest terms.
 * @param ratio — a valid ratio
 * @returns the reduced ratio
 * @throws {RangeError} if the ratio components are not positive integers
 * @example
 * simplifyRatio({ p: 6, q: 4 }); // { p: 3, q: 2 }
 */
export function simplifyRatio(ratio: Ratio): Ratio {
  requireRatio(ratio);
  const g = gcd(ratio.p, ratio.q);
  return { p: ratio.p / g, q: ratio.q / g };
}

// ─── Arithmetic ──────────────────────────────────────────────────────────────

/**
 * Multiply two ratios: (a:b) × (c:d) = (a·c):(b·d), simplified.
 * Stacking intervals in frequency space is ratio multiplication.
 * @throws {RangeError} if an input is invalid or the product exceeds the safe integer range
 * @example
 * multiplyRatios({ p: 3, q: 2 }, { p: 4, q: 3 }); // { p: 2, q: 1 }
 */
export function multiplyRatios(r1: Ratio, r2: Ratio): Ratio {
  requireRatio(r1);
  requireRatio(r2);
  return simplifyRatio({ p: r1.p * r2.p, q: r1.q * r2.q });
}

/**
 * Divide two ratios: (a:b) ÷ (c:d) = (a·d):(b·c), simplified.
 * The interval between r2 and r1 (r1 relative to r2).
 * @throws {RangeError} if an input is invalid or the result exceeds the safe integer range
 * @example
 * divideRatios({ p: 3, q: 2 }, { p: 5, q: 4 }); // { p: 6, q: 5 }
 */
export function divideRatios(r1: Ratio, r2: Ratio): Ratio {
  requireRatio(r1);
  requireRatio(r2);
  return simplifyRatio({ p: r1.p * r2.q, q: r1.q * r2.p });
}

/**
 * Invert a ratio: p:q → q:p.
 * The inverse interval (e.g. 3:2 → 2:3, a fifth inverted to a fourth).
 * @throws {RangeError} if the ratio components are not positive integers
 * @example
 * invertRatio({ p: 3, q: 2 }); // { p: 2, q: 3 }
 */
export function invertRatio(ratio: Ratio): Ratio {
  requireRatio(ratio);
  return { p: ratio.q, q: ratio.p };
}

// ─── Comparison ──────────────────────────────────────────────────────────────

/**
 * Check whether two ratios represent the same interval (after simplification).
 * @throws {RangeError} if an input is invalid
 * @example
 * ratiosEqual({ p: 6, q: 4 }, { p: 3, q: 2 }); // true
 */
export function ratiosEqual(r1: Ratio, r2: Ratio): boolean {
  const a = simplifyRatio(r1);
  const b = simplifyRatio(r2);
  return a.p === b.p && a.q === b.q;
}

/**
 * Convert a ratio to its decimal value.
 * Useful for ordering or comparing interval sizes.
 * @throws {RangeError} if the ratio components are not positive integers
 * @example
 * ratioToDecimal({ p: 3, q: 2 }); // 1.5
 */
export function ratioToDecimal(ratio: Ratio): number {
  requireRatio(ratio);
  return ratio.p / ratio.q;
}

// ─── Frequency derivation ────────────────────────────────────────────────────

/**
 * Compute the voice frequency in Hz from a root frequency and a phase ratio.
 * The ratio p:q means: for every q cycles of root, the voice completes p cycles.
 * @param rootHz — fundamental frequency in Hz (> 0)
 * @param ratio — phase ratio of the voice
 * @returns voice frequency in Hz
 * @throws {RangeError} if `rootHz` is not a positive finite number or the ratio is invalid
 * @example
 * frequencyFromRatio(220, { p: 3, q: 2 }); // 330
 */
export function frequencyFromRatio(rootHz: number, ratio: Ratio): number {
  requireFrequency(rootHz, 'rootHz');
  requireRatio(ratio);
  return rootHz * (ratio.p / ratio.q);
}

/**
 * Derive an array of voice frequencies from a root and an array of ratios.
 * The root itself is always the first element (ratio 1:1).
 * @param rootHz — fundamental frequency in Hz (> 0)
 * @param ratios — phase ratios of the voices
 * @returns frequencies in Hz, root first
 * @throws {RangeError} if `rootHz` or any ratio is invalid
 * @example
 * frequenciesFromRatios(220, [{ p: 3, q: 2 }]); // [220, 330]
 */
export function frequenciesFromRatios(rootHz: number, ratios: readonly Ratio[]): number[] {
  return [rootHz, ...ratios.map((ratio) => frequencyFromRatio(rootHz, ratio))];
}

// ─── Batch construction ──────────────────────────────────────────────────────

/**
 * Build an array of simplified ratios from a list of phase counts and a shared base.
 * @param phases — numerators (voice cycle counts), positive integers
 * @param base — denominator (fundamental cycle count), positive integer
 * @returns simplified ratios, in the same order as `phases`
 * @throws {RangeError} if `base` or any phase is not a positive integer
 * @example
 * ratiosFromPhases([3, 5, 8], 2); // [{ p: 3, q: 2 }, { p: 5, q: 2 }, { p: 4, q: 1 }]
 */
export function ratiosFromPhases(phases: readonly number[], base: number): Ratio[] {
  requirePositiveInteger(base, 'base');
  return phases.map((p) => simplifyRatio({ p, q: base }));
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format a ratio as the canonical "p:q" string.
 * @example
 * ratioToString({ p: 3, q: 2 }); // '3:2'
 */
export function ratioToString({ p, q }: Ratio): string {
  return `${p}:${q}`;
}
