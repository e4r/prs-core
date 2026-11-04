// SPDX-FileCopyrightText: 2026 Leonardo Maria Miliacca
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import * as prs from './index';

// Guards the public surface: removing or renaming an export is a breaking change
// and must be a deliberate edit of this list (and a CHANGELOG entry).
describe('public API', () => {
  it('exports exactly the documented runtime symbols', () => {
    expect(Object.keys(prs).sort()).toEqual(
      [
        'BETA',
        'DEFAULT_CONTEXT',
        'DEFAULT_TIMBRE',
        'F0',
        'TAU',
        'attraction',
        'attractionMatrix',
        'chordDissonance',
        'computeProsodicContour',
        'createRatio',
        'criticalBandwidth',
        'divideRatios',
        'frequenciesFromRatios',
        'frequencyFromRatio',
        'generateEquivalencePeriodScale',
        'harmonicDissonance',
        'invertRatio',
        'multiplyRatios',
        'plompLevelt',
        'prosodicBias',
        'rankByDissonance',
        'ratioDissonance',
        'ratioFromString',
        'ratioToDecimal',
        'ratioToString',
        'ratiosEqual',
        'ratiosFromPhases',
        'simplifyRatio',
        'stability',
        'strongestTarget',
      ].sort(),
    );
  });
});
