# Security Policy

## Supported versions

Only the latest published minor version receives fixes (the project is pre-1.0).

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through GitHub:
<https://github.com/e4r/prs-core/security/advisories/new>

Include a description, affected versions and a minimal reproduction. You can expect an acknowledgement within 7 days and an assessment, with a fix timeline, within 30 days. Fixes are released with a GitHub security advisory and credited unless you prefer otherwise.

## Scope

`@e4r/prs-core` is a pure computation library with no runtime dependencies, no I/O, and no network or filesystem access. Relevant reports include denial of service through unbounded computation on crafted input, prototype pollution, or a compromised release artifact. Releases are published from GitHub Actions with npm provenance, so a package can be traced to its source commit.
