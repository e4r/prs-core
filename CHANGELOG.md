# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the major version is 0, minor releases may contain breaking changes.

## [Unreleased]

First public release (`0.1.0`).

### Added

- Ratio arithmetic and frequency derivation (`ratio.ts`), with the exported `Ratio` type.
- Plomp–Levelt dissonance for pure tones, harmonic tones, ratios and chords (`dissonance.ts`).
- Equivalence-period (generalised EDO) scale generation (`sequences.ts`).
- Prosodic resolution contour (`prosody.ts`) and stability / attraction model (`resolution.ts`).
- Dual ESM/CommonJS build with type declarations; package validated with `publint` and `@arethetypeswrong/cli`.
- Test suite with property-based tests (`fast-check`) and coverage thresholds.
- CI, CodeQL, OpenSSF Scorecard, Dependabot, tag-based npm release with provenance.
- `CITATION.cff`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.

### Changed

- Licence is **AGPL-3.0-only** throughout: `LICENSE`, `package.json`, `CITATION.cff`, the README and SPDX headers (previously `package.json` and the README declared CC BY-NC 4.0 while `LICENSE` held the AGPL-3.0 text).
- Package name is `@e4r/prs-core` everywhere (the README previously said `@miliacca/prs-core`).
- The README now documents the API that actually exists. Names it previously listed (`buildChord`, `computeFrequency`, `chordConsonance`, `fibonacci`, `lucas`, `primes`, `phiEDO`, `PHI`, …) were never implemented.
- Public functions now validate their input and throw `RangeError` for non-positive, non-finite or non-integer values where a positive finite number or integer is required (previously they could return `NaN`, `Infinity` or wrong values). Ratio multiplication/division throw instead of exceeding the safe integer range.
- `ratio.ts` and `dissonance.ts` use the shared `Ratio` type; array parameters are `readonly`.
- `generateEquivalencePeriodScale` returns the exported `ScaleStep[]` type.

### Known issues

- `plompLevelt`: the documentation says the roughness curve peaks at Δf ≈ 0.25 · CBW, but the implemented constants (`x = Δf / (0.25 · CBW)`, decay 3.5 / 5.75) place the maximum at ≈ 0.055 · CBW — several times narrower than the usual Plomp–Levelt / Sethares parametrisation. Not changed here, because it alters every downstream numerical result; tracked by the `it.fails` test "peaks at 0.25 · CBW as documented".
- `stability`: with the default timbre and context the tonic is rated less stable than the second degree (tracked by an `it.fails` test in `resolution.test.ts`); likely related to the point above.
- `TAU` and `BETA` are provisional values, not fitted to data.
