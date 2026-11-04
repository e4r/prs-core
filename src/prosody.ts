// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

// Prosodic resolution: where each scale degree "wants" to go on the dissonance curve.
//
// For a root at baseFrequencyHz, the dissonance of a voice at interval Δx (in octaves,
// Δx = log2(frequency ratio)) is D(Δx) = harmonicDissonance(root, root · 2^Δx).
// A degree sitting on a slope of D feels pulled toward the nearest local minimum of D
// (a consonant resting point); the steeper the slope, the more urgent the pull.

import { harmonicDissonance } from './dissonance';

// ─── Constants ───────────────────────────────────────────────────────────────

// Cents in one octave — conversion between Δx (octaves) and cents
const CENTS_PER_OCTAVE = 1200;

// Resolution of the grid used to locate local minima of D(Δx), in cents
const SEARCH_GRID_STEP_CENTS = 1;

// How far past the outermost degree (and past the unison and the octave) the
// search extends, in octaves, so that minima just outside the scale are found
const SEARCH_MARGIN_OCTAVES = 0.25;

// Upper search bound is at least one octave, so the 2:1 minimum is always reachable
const MINIMUM_SEARCH_SPAN_OCTAVES = 1;

// Iterations of the golden-section search that refines each grid minimum
const MINIMUM_REFINEMENT_ITERATIONS = 40;

// Golden ratio conjugate, (√5 − 1) / 2 — the shrink factor of golden-section search
const GOLDEN_SECTION_CONJUGATE = (Math.sqrt(5) - 1) / 2;

// Half-width of the central difference used to estimate dD/dΔx, in cents
const DERIVATIVE_HALF_STEP_CENTS = 0.5;

// A degree closer than this to a minimum is considered already at rest, in cents
const AT_REST_TOLERANCE_CENTS = 1;

// Number of harmonics per tone used when evaluating D(Δx)
const CONTOUR_HARMONICS = 6;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DegreeResolution {
  /** Δx (octaves) of the nearest local minimum of D this degree resolves toward. */
  target: number;
  /** 1 = resolves upward, -1 = downward, 0 = already at rest. */
  direction: 1 | -1 | 0;
  /** Absolute distance from the degree to its target, in cents. */
  distanceCents: number;
  /** D(Δx of the degree) − D(target): dissonance released by resolving (≥ 0). */
  tensionReleased: number;
  /** |dD/dΔx| at the degree: how steeply the curve pulls it, per octave. */
  urgency: number;
}

// ─── Internals ───────────────────────────────────────────────────────────────

function dissonanceAtInterval(baseFrequencyHz: number, deltaXOctaves: number): number {
  return harmonicDissonance(baseFrequencyHz, baseFrequencyHz * Math.pow(2, deltaXOctaves), CONTOUR_HARMONICS);
}

// Golden-section search for the minimum of D inside [lowerOctaves, upperOctaves]
function refineMinimum(baseFrequencyHz: number, lowerOctaves: number, upperOctaves: number): number {
  let lower = lowerOctaves;
  let upper = upperOctaves;
  let left = upper - GOLDEN_SECTION_CONJUGATE * (upper - lower);
  let right = lower + GOLDEN_SECTION_CONJUGATE * (upper - lower);
  let leftValue = dissonanceAtInterval(baseFrequencyHz, left);
  let rightValue = dissonanceAtInterval(baseFrequencyHz, right);
  for (let i = 0; i < MINIMUM_REFINEMENT_ITERATIONS; i++) {
    if (leftValue < rightValue) {
      upper = right;
      right = left;
      rightValue = leftValue;
      left = upper - GOLDEN_SECTION_CONJUGATE * (upper - lower);
      leftValue = dissonanceAtInterval(baseFrequencyHz, left);
    } else {
      lower = left;
      left = right;
      leftValue = rightValue;
      right = lower + GOLDEN_SECTION_CONJUGATE * (upper - lower);
      rightValue = dissonanceAtInterval(baseFrequencyHz, right);
    }
  }
  return (lower + upper) / 2;
}

// Δx (octaves) of every local minimum of D within [lowerOctaves, upperOctaves], ascending
function findLocalMinima(baseFrequencyHz: number, lowerOctaves: number, upperOctaves: number): number[] {
  const stepOctaves = SEARCH_GRID_STEP_CENTS / CENTS_PER_OCTAVE;
  const pointCount = Math.floor((upperOctaves - lowerOctaves) / stepOctaves) + 1;
  const gridValues: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    gridValues.push(dissonanceAtInterval(baseFrequencyHz, lowerOctaves + i * stepOctaves));
  }

  const minima: number[] = [];
  // Interior points only: the search range is padded so true minima never sit on its edge
  for (let i = 1; i < pointCount - 1; i++) {
    if (gridValues[i] < gridValues[i - 1] && gridValues[i] <= gridValues[i + 1]) {
      minima.push(
        refineMinimum(baseFrequencyHz, lowerOctaves + (i - 1) * stepOctaves, lowerOctaves + (i + 1) * stepOctaves),
      );
    }
  }
  return minima;
}

function slopeOfDissonance(baseFrequencyHz: number, deltaXOctaves: number): number {
  const halfStepOctaves = DERIVATIVE_HALF_STEP_CENTS / CENTS_PER_OCTAVE;
  const above = dissonanceAtInterval(baseFrequencyHz, deltaXOctaves + halfStepOctaves);
  const below = dissonanceAtInterval(baseFrequencyHz, deltaXOctaves - halfStepOctaves);
  return (above - below) / (2 * halfStepOctaves);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Prosodic resolution of each degree of a scale.
 *
 * @param deltaXOctaves — Δx = log2(ratio to the tonic) of each degree, in octaves
 *   (the tonic itself is Δx = 0)
 * @param baseFrequencyHz — frequency of the tonic in Hz (must be > 0)
 * @returns one DegreeResolution per input degree, in the same order
 */
export function computeProsodicContour(deltaXOctaves: number[], baseFrequencyHz: number): DegreeResolution[] {
  if (!Number.isFinite(baseFrequencyHz) || baseFrequencyHz <= 0) {
    throw new RangeError(`Base frequency must be a positive number of Hz; got ${baseFrequencyHz}`);
  }
  if (deltaXOctaves.some((deltaX) => !Number.isFinite(deltaX))) {
    throw new RangeError('Every Δx must be a finite number of octaves');
  }
  if (deltaXOctaves.length === 0) return [];

  const lowerOctaves = Math.min(0, ...deltaXOctaves) - SEARCH_MARGIN_OCTAVES;
  const upperOctaves = Math.max(MINIMUM_SEARCH_SPAN_OCTAVES, ...deltaXOctaves) + SEARCH_MARGIN_OCTAVES;
  const minima = findLocalMinima(baseFrequencyHz, lowerOctaves, upperOctaves);

  return deltaXOctaves.map((deltaX) => {
    const target = minima.reduce(
      (nearest, candidate) => (Math.abs(candidate - deltaX) < Math.abs(nearest - deltaX) ? candidate : nearest),
      minima[0] ?? deltaX,
    );
    const distanceCents = Math.abs(target - deltaX) * CENTS_PER_OCTAVE;
    const atRest = distanceCents <= AT_REST_TOLERANCE_CENTS;
    const direction: 1 | -1 | 0 = atRest ? 0 : target > deltaX ? 1 : -1;

    return {
      target,
      direction,
      distanceCents,
      tensionReleased: Math.max(
        0,
        dissonanceAtInterval(baseFrequencyHz, deltaX) - dissonanceAtInterval(baseFrequencyHz, target),
      ),
      urgency: Math.abs(slopeOfDissonance(baseFrequencyHz, deltaX)),
    };
  });
}
