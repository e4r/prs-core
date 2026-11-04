# Releasing

Releases are published by [`.github/workflows/release.yml`](../.github/workflows/release.yml) when a `vX.Y.Z` tag is pushed. The workflow checks that the tag matches `package.json`, that the tagged commit is on `main`, runs the full `npm run verify`, publishes to npm **with provenance**, and creates the GitHub release.

## One-time setup

1. On npmjs.com, make sure the `@e4r` scope exists and you own it.
2. Configure a **trusted publisher** for the package (package → Settings → Trusted Publisher → GitHub Actions): owner `e4r`, repository `prs-core`, workflow `release.yml`, environment `npm`. This lets the workflow publish through OIDC, so **no npm token is stored in GitHub**.
   The very first publish of a new package name may need to be done once manually (`npm publish --access public`) before a trusted publisher can be attached.
3. Create the `npm` environment in the repository settings (see [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)).

## Each release

1. Move the **Unreleased** entries in `CHANGELOG.md` under a new `## [X.Y.Z] - YYYY-MM-DD` heading and add a fresh empty **Unreleased** section.
2. Update `version` in `package.json` and `CITATION.cff` (`npm version X.Y.Z --no-git-tag-version`).
3. Open a PR, get CI green, merge to `main`.
4. Tag the merge commit and push the tag:

   ```bash
   git switch main && git pull
   git tag -s vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

5. Watch the **Release** workflow; confirm the package page on npm shows the provenance badge.

While the version is `0.x`, breaking changes bump the minor version. From `1.0.0`, follow SemVer strictly.
