# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not open a
public GitHub issue**.  Instead, report it privately using one of these channels:

- **GitHub private vulnerability reporting** — use the "Report a vulnerability"
  button on the [Security tab](../../security/advisories/new) of this repository.
- **Email** — send details to the maintainers listed in `package.json` (or open a
  blank private advisory if no email is listed).

You will receive an acknowledgement within **72 hours** and a resolution timeline
within **7 days** of the initial report.

---

## Dependency Vulnerability Management

### Automated scanning

| Tool | Trigger | Purpose |
|------|---------|---------|
| `npm audit` in CI | Every push / pull request | Blocks merge on **critical** or **high** findings |
| Weekly security workflow (`.github/workflows/security.yml`) | Every Monday 08:00 UTC | Full audit report; opens / updates a GitHub issue when critical/high vulns are found |
| Dependabot (`.github/dependabot.yml`) | Weekly (Monday) | Automatic PRs for patch and minor dependency updates |

### Severity thresholds

The CI pipeline uses `npm audit --audit-level=high`.  This means:

| Severity | CI behaviour |
|----------|-------------|
| **Critical** | ❌ Fails the build immediately |
| **High** | ❌ Fails the build immediately |
| **Moderate** | ⚠️ Reported in the audit output but does not fail the build |
| **Low** | ℹ️ Reported but does not fail the build |

### Remediation SLA by severity

The following timelines apply from the point at which a vulnerability is confirmed
(CVE published and affects a version we use):

| Severity | Target remediation | Maximum deadline |
|----------|--------------------|-----------------|
| **Critical** (CVSS ≥ 9.0) | Within **24 hours** | **3 days** |
| **High** (CVSS 7.0–8.9) | Within **3 days** | **7 days** |
| **Moderate** (CVSS 4.0–6.9) | Within **2 weeks** | **30 days** |
| **Low** (CVSS < 4.0) | Next scheduled dependency update | **90 days** |

If a fix is not available within the deadline (e.g. upstream has not yet released a
patch), the affected dependency must be temporarily replaced with a safe alternative
or its usage must be removed.  Any exception requires an explicit decision recorded
in a GitHub issue with the `security` label.

### Handling Dependabot PRs

1. **Patch updates** — grouped into a single weekly PR by Dependabot.  Merge after
   CI passes; no manual review required unless the package is security-sensitive.
2. **Minor updates** — review the changelog before merging.  Run the test suite
   locally if the package is a runtime dependency.
3. **Major updates** — open a separate tracking issue, plan the upgrade, and test
   thoroughly.  Do not merge automatically.
4. **Security advisories** — Dependabot will open a PR immediately outside the
   normal schedule.  Treat as Critical/High per the SLA table above.

### Manual remediation steps

```bash
# See all current vulnerabilities
npm audit

# Apply automatic patch-level fixes
npm audit fix

# See what would change without applying (dry run)
npm audit fix --dry-run

# Force a breaking-change fix (use with care — review changelog first)
npm audit fix --force
```

---

## Secret Scanning (#494)

### Automated scanning

| Tool | Trigger | Purpose |
|------|---------|---------|
| Gitleaks CI workflow (`.github/workflows/secret-scan.yml`) | Every push / pull request to `main` | Scans the full clone history and the PR diff for committed secrets; fails the job on any finding |
| Gitleaks pre-commit hook (`.husky/pre-commit`) | Every local commit | Scans staged changes only, using the same `.gitleaks.toml` rule set, for fast local feedback before a secret is even pushed |

Both use [`.gitleaks.toml`](.gitleaks.toml) at the repo root, so local and CI
results always agree. Findings report the file, line, and matched secret type
(rule name); CI additionally leaves a PR comment summarizing them.

### Remediation flow

If Gitleaks (locally or in CI) reports a finding:

1. **Do not push / do not merge** until it's resolved — a finding blocks the
   pre-commit hook and fails CI by design.
2. **Revoke** the exposed credential immediately at its source (API provider,
   cloud console, bot token settings, etc.) — assume it is compromised the
   moment it touches git history, even if the commit was never pushed.
3. **Remove it from the working tree**, replacing it with an environment
   variable or a reference to a secrets manager. See the storage policy in
   `src/utils/storage.ts` for what belongs client-side (nothing sensitive) vs.
   server-side.
4. **Purge it from history** if it was committed: `git filter-repo` (preferred
   over the deprecated `git filter-branch` / BFG) to rewrite the offending
   commit(s), then force-push and have all collaborators re-clone.
5. **Re-run the scan** (`gitleaks detect --config .gitleaks.toml`) to confirm
   the finding is gone before reopening the PR.
6. **Alert** — post in the team's security channel (or open a private security
   advisory per the reporting process above) noting what was exposed, for how
   long, and that it was revoked, so downstream consumers of that credential
   know to expect rotation.

A rule that's too broad for this repo (a false positive) belongs in the
`[allowlist]` section of `.gitleaks.toml`, not silenced ad hoc — keep it
narrowly scoped (a specific path or regex, not a whole rule) with a comment
explaining why.

---

## Supply-Chain Health — OpenSSF Scorecard (#495)

[`.github/workflows/scorecards.yml`](.github/workflows/scorecards.yml) runs the
[OpenSSF Scorecard](https://github.com/ossf/scorecard) weekly (and on demand via
`workflow_dispatch`), scoring the repo across checks like branch protection,
pinned dependencies, token permissions, and dependency update tooling. Results
are uploaded as a SARIF file to the repo's code scanning alerts and as a
workflow artifact; the current score is shown by the badge on the
[README](README.md).

When the score changes meaningfully (a check flips passing/failing, or the
aggregate score moves by more than a point or two), note the delta and what
changed in that release's notes — the Scorecard results page linked from the
badge has the check-by-check breakdown to cite.

---

## Scope

This policy applies to the frontend application in this repository.  Backend,
smart contract, and infrastructure security are handled in their respective
repositories.
