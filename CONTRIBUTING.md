# Contributing to @e4r/prs-core

Thank you for your interest! Bug reports, test cases, documentation fixes and focused pull requests are welcome. By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and ideas:** open an issue first for anything larger than a typo, so we can agree on the approach.
- **Security issues:** do not open a public issue; follow [SECURITY.md](SECURITY.md).
- **Model changes:** this library implements published psychoacoustic models and the PRS paper. A change that alters numerical results must cite its source and be listed in the changelog.

## Development setup

Requires Node.js 22.18+ (the toolchain; the published package supports Node 20+).

```bash
git clone https://github.com/e4r/prs-core.git
cd prs-core
npm ci
npm run verify   # typecheck + lint + format check + tests with coverage + build + package checks
```

Useful scripts:

| Script                  | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `npm test`              | Run the tests once                           |
| `npm run test:watch`    | Watch mode                                   |
| `npm run test:coverage` | Tests with coverage thresholds               |
| `npm run typecheck`     | `tsc --noEmit`                               |
| `npm run lint`          | ESLint                                       |
| `npm run format`        | Prettier (write)                             |
| `npm run build`         | Build `dist/` (ESM + CJS + types)            |
| `npm run check:package` | `publint` and `are-the-types-wrong`          |
| `npm run smoke`         | Import the built package as ESM and CommonJS |

## Pull requests

1. Branch from `main`; `main` is protected and only changes through pull requests with a green `ci-success` check.
2. Keep each PR focused. Add or update tests — including invalid input and edge cases — and JSDoc with an `@example` for any public function.
3. Add an entry under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
4. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`; add `!` for breaking changes).
5. Source files carry the SPDX header used throughout `src/`.

Public API changes (adding, removing or renaming an export) must update the list in `src/index.test.ts` deliberately.

## Licensing of contributions

The project is licensed under the [GNU AGPL v3.0](LICENSE), and the author may also offer separate commercial licences. So that this remains possible, by submitting a contribution (pull request, patch or otherwise) you confirm that you wrote it or have the right to submit it, and you:

1. license it to the project and its users under AGPL-3.0-only, and
2. grant the maintainer a perpetual, worldwide, non-exclusive, royalty-free, irrevocable right to use, modify, sublicense and relicense your contribution, including under other terms such as a commercial licence.

If you cannot agree to this, please open an issue to discuss instead of sending code.
