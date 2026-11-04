# Protecting `main`

The repository ships a ready-to-import GitHub ruleset: [`.github/rulesets/main.json`](../.github/rulesets/main.json).

It enforces on the default branch:

- changes only through pull requests, with review conversations resolved and stale approvals dismissed on new pushes;
- the required status checks **`ci-success`** (aggregates the whole CI matrix, runtime compatibility and the dependency audit) and **`analyze`** (CodeQL), on an up-to-date branch;
- linear history, no force pushes, no branch deletion;
- no bypass actors, so the rules also apply to administrators.

Required approvals are set to `0` so that a sole maintainer can merge their own PRs. Raise `required_approving_review_count` to `1` (and set `require_code_owner_review` to `true`) once there is a second maintainer.

## Apply it

**Web UI:** Settings → Rules → Rulesets → New ruleset → **Import a ruleset** → choose `.github/rulesets/main.json`.

**GitHub CLI:**

```bash
gh api --method POST repos/e4r/prs-core/rulesets --input .github/rulesets/main.json
```

> The status checks must have run at least once before GitHub offers them as required: push a branch, open a PR, let CI and CodeQL finish, then import the ruleset.

## Other recommended repository settings

- Settings → Code security: enable **Private vulnerability reporting**, **Dependabot alerts**, **Dependabot security updates** and **Secret scanning with push protection**.
- Settings → Actions → General: _Workflow permissions_ = read-only; require approval for first-time contributors' workflow runs.
- Settings → Environments: create an environment named **`npm`** (used by the release workflow); optionally require your approval before it runs.
- Settings → General: allow squash merging only, and default the commit message to the PR title.
