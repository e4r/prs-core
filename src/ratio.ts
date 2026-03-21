// Phase ratio math: creation, arithmetic, simplification, and frequency derivation

// ─── Internal helpers ────────────────────────────────────────────────────────

// Euclidean GCD — used exclusively for ratio simplification
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// ─── Construction ────────────────────────────────────────────────────────────

/**
 * Create a ratio object from two positive integers.
 * @param {number} p — numerator (cycles of the voice)
 * @param {number} q — denominator (cycles of the fundamental)
 * @returns {{ p: number, q: number }}
 */
export function createRatio(p: number, q: number): { p: number, q: number } {
  if (!Number.isInteger(p) || !Number.isInteger(q) || p <= 0 || q <= 0) {
    throw new RangeError(`Ratio components must be positive integers; got ${p}:${q}`);
  }
  return { p, q };
}

/**
 * Parse a "p:q" string into a ratio object.
 * @param {string} str — e.g. "3:2"
 * @returns {{ p: number, q: number }}
 */
export function ratioFromString(str: string): { p: number, q: number } {
  const parts = str.split(':').map(Number);
  if (parts.length !== 2) throw new SyntaxError(`Expected "p:q" format; got "${str}"`);
  return createRatio(parts[0], parts[1]);
}

// ─── Simplification ──────────────────────────────────────────────────────────

/**
 * Reduce a ratio to its lowest terms.
 * { p: 6, q: 4 } → { p: 3, q: 2 }
 * @param {{ p: number, q: number }} ratio
 * @returns {{ p: number, q: number }}
 */
export function simplifyRatio({ p, q }: { p: number, q: number }): { p: number, q: number } {
  const g = gcd(p, q);
  return { p: p / g, q: q / g };
}

// ─── Arithmetic ──────────────────────────────────────────────────────────────

/**
 * Multiply two ratios: (a:b) × (c:d) = (a·c):(b·d), simplified.
 * Stacking intervals in frequency space is ratio multiplication.
 * @param {{ p: number, q: number }} r1
 * @param {{ p: number, q: number }} r2
 * @returns {{ p: number, q: number }}
 */
export function multiplyRatios(r1: { p: number, q: number }, r2: { p: number, q: number }): { p: number, q: number } {
  return simplifyRatio({ p: r1.p * r2.p, q: r1.q * r2.q });
}

/**
 * Divide two ratios: (a:b) ÷ (c:d) = (a·d):(b·c), simplified.
 * The interval between r2 and r1 (r1 relative to r2).
 * @param {{ p: number, q: number }} r1
 * @param {{ p: number, q: number }} r2
 * @returns {{ p: number, q: number }}
 */
export function divideRatios(r1: { p: number, q: number }, r2: { p: number, q: number }): { p: number, q: number } {
  return simplifyRatio({ p: r1.p * r2.q, q: r1.q * r2.p });
}

/**
 * Invert a ratio: p:q → q:p.
 * The inverse interval (e.g. 3:2 → 2:3, a fifth inverted to a fourth).
 * @param {{ p: number, q: number }} ratio
 * @returns {{ p: number, q: number }}
 */
export function invertRatio({ p, q }: { p: number, q: number }): { p: number, q: number } {
  return { p: q, q: p };
}

// ─── Comparison ──────────────────────────────────────────────────────────────

/**
 * Check whether two ratios represent the same interval (after simplification).
 * @param {{ p: number, q: number }} r1
 * @param {{ p: number, q: number }} r2
 * @returns {boolean}
 */
export function ratiosEqual(r1: { p: number, q: number }, r2: { p: number, q: number }): boolean {
  const a = simplifyRatio(r1);
  const b = simplifyRatio(r2);
  return a.p === b.p && a.q === b.q;
}

/**
 * Convert a ratio to its decimal value.
 * Useful for ordering or comparing interval sizes.
 * @param {{ p: number, q: number }} ratio
 * @returns {number}
 */
export function ratioToDecimal({ p, q }: { p: number, q: number }): number {
  return p / q;
}

// ─── Frequency derivation ────────────────────────────────────────────────────

/**
 * Compute the voice frequency in Hz from a root frequency and a phase ratio.
 * The ratio p:q means: for every q cycles of root, the voice completes p cycles.
 * @param {number} rootHz — fundamental frequency in Hz
 * @param {{ p: number, q: number }} ratio
 * @returns {number} — voice frequency in Hz
 */
export function frequencyFromRatio(rootHz: number, { p, q }: { p: number, q: number }): number {
  return rootHz * (p / q);
}

/**
 * Derive an array of voice frequencies from a root and an array of ratios.
 * The root itself is always the first element (ratio 1:1).
 * @param {number} rootHz
 * @param {Array<{ p: number, q: number }>} ratios
 * @returns {number[]} — frequencies in Hz, root first
 */
export function frequenciesFromRatios(rootHz: number, ratios: Array<{ p: number, q: number }>): number[] {
  return [rootHz, ...ratios.map(r => frequencyFromRatio(rootHz, r))];
}

// ─── Batch construction ──────────────────────────────────────────────────────

/**
 * Build an array of simplified ratios from a list of phase counts and a shared base.
 * e.g. phases = [3, 5, 8], base = 2 → [{ p:3, q:2 }, { p:5, q:2 }, { p:4, q:1 }]
 * @param {number[]} phases — numerators (voice cycle counts)
 * @param {number} base — denominator (fundamental cycle count)
 * @returns {Array<{ p: number, q: number }>}
 */
export function ratiosFromPhases(phases: number[], base: number): Array<{ p: number, q: number }> {
  return phases.map(p => simplifyRatio({ p, q: base }));
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format a ratio as the canonical "p:q" string.
 * @param {{ p: number, q: number }} ratio
 * @returns {string}
 */
export function ratioToString({ p, q }: { p: number, q: number }): string {
  return `${p}:${q}`;
}
