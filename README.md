# @miliacca/prs-core

Core library for **Phase Ratio Synthesis (PRS)** — a frequency-native framework for interval-ratio composition beyond equal temperament.

> Companion library to the paper: *Phase Ratio Synthesis: A Frequency-Native Framework for Interval-Ratio Composition*, Leonardo Maria Miliacca, 2026.

## Install

```bash
npm install @miliacca/prs-core
```

## Usage

```typescript
import { buildChord, chordConsonance, fibonacci } from '@miliacca/prs-core';

// Build a chord: base=2, voices=[3,5] → perfect fifth + major tenth
const frequencies = buildChord(220, 2, [3, 5]);
// [330, 550]

// Score its consonance (Plomp-Levelt model)
const score = chordConsonance(frequencies);
// e.g. 87

// Generate a Fibonacci scale
const seq = fibonacci(7); // [1,1,2,3,5,8,13]
const scale = buildChord(220, 1, seq);
```

## API

### Ratio
- `computeFrequency(root, p, q)` — frequency of a p:q ratio from root
- `buildChord(root, base, voices)` — chord frequencies from phase parameters
- `buildScale(root, base, sequence)` — alias for buildChord, semantic for scales
- `periodFrequency(root, periodRatio)` — period of equivalence frequency

### Dissonance
- `pureToneDissonance(f1, f2, a1?, a2?)` — Plomp-Levelt for pure sinusoids
- `complexToneDissonance(f1, f2, harmonics?)` — extended to harmonic series
- `chordConsonance(frequencies, harmonics?)` — aggregate score 0–100
- `criticalBandwidth(f)` — CBW(f) = 1.72 × f^0.65

### Sequences
- `fibonacci(n)` — [1,1,2,3,5,8,13,...]
- `lucas(n)` — [2,1,3,4,7,11,...]
- `primes(n)` — [2,3,5,7,11,...]
- `harmonicSeries(n, start?)` — [1,2,3,4,...]
- `powersOfTwo(n)` — [1,2,4,8,...]
- `phiEDO(steps)` — equal divisions of φ period
- `PHI` — (1+√5)/2 ≈ 1.618

## License

CC BY-NC 4.0 — free for academic and personal use, commercial use reserved.
