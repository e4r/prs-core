# @e4r/prs-core

[![CI](https://github.com/e4r/prs-core/actions/workflows/ci.yml/badge.svg)](https://github.com/e4r/prs-core/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@e4r/prs-core)](https://www.npmjs.com/package/@e4r/prs-core)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/e4r/prs-core/badge)](https://scorecard.dev/viewer/?uri=github.com/e4r/prs-core)

Core library for **Phase Ratio Synthesis (PRS)** — a frequency-native framework for interval-ratio composition beyond equal temperament.

> Companion library to the paper: _Phase Ratio Synthesis: A Frequency-Native Framework for Interval-Ratio Composition_, Leonardo Maria Miliacca, 2026.

Zero runtime dependencies · ESM and CommonJS · TypeScript types included · ES2022 output; tested in CI on Node.js 20, 22 and 24.

## Install

```bash
npm install @e4r/prs-core
```

## Usage

```typescript
import {
  createRatio,
  frequencyFromRatio,
  frequenciesFromRatios,
  ratiosFromPhases,
  chordDissonance,
  generateEquivalencePeriodScale,
} from '@e4r/prs-core';

// A phase ratio p:q — the voice completes p cycles for every q cycles of the root
const fifth = createRatio(3, 2);
frequencyFromRatio(220, fifth); // 330

// A chord from phase counts over a shared base: 4:5:6 over A3
const ratios = ratiosFromPhases([5, 6], 4); // [{ p: 5, q: 4 }, { p: 3, q: 2 }]
const chord = frequenciesFromRatios(220, ratios); // [220, 275, 330]

// Psychoacoustic roughness (Plomp–Levelt, summed over harmonic partials): lower = smoother
chordDissonance(chord) < chordDissonance([220, 233, 247]); // true — a major triad vs. a cluster

// A scale that divides an arbitrary period — here the golden ratio φ, 7 steps
const phi = (1 + Math.sqrt(5)) / 2;
generateEquivalencePeriodScale(220, phi, 7).map((step) => step.frequencyHz);
// [220, 235.7, 252.4, 270.4, 289.6, 310.2, 332.3, 356]
```

All functions validate their input and throw a `RangeError` (or `SyntaxError` for malformed `"p:q"` strings) rather than returning `NaN` or silently wrong values.

## API

Every function is documented with JSDoc (hover in your editor) and has runnable `@example`s.

### Ratios — `ratio.ts`

- `Ratio` — `{ p: number; q: number }`
- `createRatio(p, q)`, `ratioFromString("3:2")`, `ratioToString(r)`
- `simplifyRatio(r)`, `invertRatio(r)`, `ratiosEqual(a, b)`, `ratioToDecimal(r)`
- `multiplyRatios(a, b)`, `divideRatios(a, b)` — interval stacking and difference (throw on integer overflow instead of losing precision)
- `frequencyFromRatio(rootHz, r)`, `frequenciesFromRatios(rootHz, rs)` — root first
- `ratiosFromPhases(phases, base)`

### Dissonance — `dissonance.ts`

- `criticalBandwidth(f)` — CBW(f) = 1.72 · f^0.65
- `plompLevelt(f1, f2, a1, a2)` — roughness of two pure tones
- `harmonicDissonance(f1, f2, harmonics?)` — two harmonic complex tones
- `ratioDissonance(rootHz, ratio, harmonics?)`, `rankByDissonance(rootHz, ratios, harmonics?)`
- `chordDissonance(frequencies, harmonics?)` — sum over all voice pairs

### Scales — `sequences.ts`

- `generateEquivalencePeriodScale(rootHz, period, steps)` — generalised EDO: `root · period^(i/steps)` for `i = 0…steps` (12-TET is `period = 2`, `steps = 12`)

### Prosody — `prosody.ts`

- `computeProsodicContour(deltaXOctaves, baseFrequencyHz)` — for each degree, the nearest local minimum of the dissonance curve it resolves toward, with direction, distance in cents, tension released and urgency

### Resolution — `resolution.ts`

- `stability(degree, ctx?)`, `attraction(from, to, ctx?)`, `attractionMatrix(scale, ctx?)`, `strongestTarget(from, scale, ctx?)`, `prosodicBias(from, to, phrasePos, beta?)`
- Defaults: `TAU`, `BETA`, `F0`, `DEFAULT_TIMBRE`, `DEFAULT_CONTEXT`. **`TAU` and `BETA` are provisional and not fitted to data.**

## Status and known limitations

The library is pre-1.0: minor versions may include breaking changes, always listed in the [CHANGELOG](CHANGELOG.md). Two modelling caveats are tracked openly (see _Known issues_ in the changelog) and covered by `it.fails` tests, so that fixing them is noticed:

- the Plomp–Levelt curve in `plompLevelt` peaks at about 0.055 · CBW, not at the 0.25 · CBW stated in its documentation;
- with the default timbre and context, the tonic is rated slightly _less_ stable than the second degree.

If you rely on numerical results, pin an exact version.

## Contributing

Bug reports, test cases and focused pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately as described in [SECURITY.md](SECURITY.md).

## Citing

If you use this library in academic work, please cite it and the paper; GitHub's **Cite this repository** button uses [CITATION.cff](CITATION.cff).

## License

Copyright © 2026 Leonardo Maria Miliacca.

Released under the [GNU Affero General Public License v3.0](LICENSE) (`AGPL-3.0-only`).

You may use, study, modify and redistribute this library, including commercially, provided that any derivative work — and, under section 13, any network service that lets users interact with a modified version — is made available under the same license, with its source code. If those terms do not fit your project, contact the author about a separate commercial license.
