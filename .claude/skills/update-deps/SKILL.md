---
name: update-vulnerable-deps
description: Update vulnerable npm dependencies safely. Only applies non-breaking changes. Prefers lock-file-only fixes via `npm audit fix`. Generates a summary of what was updated, what was skipped, and why. Use when asked to fix security vulnerabilities, run dependabot-style updates, or update vulnerable packages.
---

# Update Vulnerable Dependencies

## Goal

Fix npm dependency vulnerabilities with minimal risk:
1. Lock-file-only fixes first (`npm audit fix`)
2. Non-breaking package.json bumps second (minor/patch only)
3. Skip breaking changes (major version bumps) — document them instead

Never introduce breaking changes without explicit user approval.

## Steps

### 1. Baseline audit

```bash
npm audit --json > /tmp/audit-before.json
npm audit 2>&1 | tail -5
```

Record total vulnerabilities (critical/high/moderate/low) before starting.

### 2. Lock-file fix (safest — no package.json changes)

```bash
npm audit fix
```

This only updates `package-lock.json` to use compatible versions already allowed by the existing semver ranges in `package.json`. It never changes `package.json`.

Re-run audit to see what remains:

```bash
npm audit 2>&1
```

### 3. Check remaining vulnerabilities

For each remaining vulnerability, determine why `npm audit fix` did not resolve it:

```bash
npm audit --json 2>/dev/null | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const vulns = d.vulnerabilities || {};
Object.entries(vulns).forEach(([name, v]) => {
  if (v.isDirect) {
    console.log(name, v.severity, 'fixAvailable:', JSON.stringify(v.fixAvailable));
  }
});
"
```

The `fixAvailable` field tells you:
- `false` — no fix exists yet
- `{ isSemVerMajor: true, ... }` — fix requires a major (breaking) version bump
- `{ isSemVerMajor: false, name, version }` — fix is a non-breaking update

### 4. Apply non-breaking package.json updates

For each vulnerability where `isSemVerMajor: false`:

1. Check the current version range in `package.json` (direct dependency or devDependency).
2. If it's a **direct dependency**, update the version range:
   ```bash
   npm install <package>@<fix-version>
   ```
3. Re-run `npm audit` after each update to confirm the fix landed.

Do NOT apply `npm audit fix --force` — it may break the build.

### 5. Changelog review for major version bumps

For every package where `isSemVerMajor: true`, **do not assume tests are sufficient**. You MUST check the changelog before deciding to skip or apply.

Steps for each major-bump package:

1. Look up the package on npm or GitHub (e.g., `https://github.com/<org>/<pkg>/releases` or `CHANGELOG.md`).
2. Read the breaking changes section between the current version and the fix version.
3. Decide:
   - **Safe to apply** — breaking changes do not affect this project's usage (e.g., removed API that this codebase never calls, Node version requirement we already meet).
   - **Skip** — breaking changes affect this project (changed API, renamed export, removed feature in use).
4. If safe, apply with `npm install <package>@<fix-version>`, then run build + test + lint.
5. Document your finding in the summary report under the appropriate section.

Never mark a major-bump package as "safe" based solely on passing tests. Tests may not cover the affected code path.

### 6. Build and test verification

After all updates (non-breaking and any approved major bumps):

```bash
npm run build
npm run test
npm run lint
```

If any step fails, revert the last change and document the package as "skipped — breaks build/tests".

### 7. Commit

After verification passes, commit `package.json` and `package-lock.json` together:

```bash
git add package.json package-lock.json
git commit -m "Update vulnerable dependencies (non-breaking)"
```

Use a more descriptive message if notable packages were updated, e.g.:
```
Fix security vulnerabilities: bump vite to 6.4.3, postcss to 8.5.15
```

Do NOT commit `node_modules/` or any other files.

### 8. Generate summary report

Output a report in this format:

---

## Dependency Update Summary

**Date:** [today's date]

### Vulnerabilities Before
| Severity | Count |
|----------|-------|
| Critical | N |
| High     | N |
| Moderate | N |
| Low      | N |

### Fixed (lock-file only via `npm audit fix`)
List packages resolved by lock-file update only.

### Fixed (package.json updated)
| Package | Old Version | New Version | Severity Fixed |
|---------|-------------|-------------|----------------|
| ...     | ...         | ...         | ...            |

### Skipped — Breaking Change (major version bump required)
| Package | Current | Fix Version | Severity | Reason Skipped |
|---------|---------|-------------|----------|----------------|
| ...     | ...     | ...         | ...      | Requires major version bump — review manually |

### Skipped — No Fix Available
| Package | Severity | Notes |
|---------|----------|-------|
| ...     | ...      | No upstream fix released yet |

### Vulnerabilities After
| Severity | Count |
|----------|-------|
| Critical | N |
| High     | N |
| Moderate | N |
| Low      | N |

---

## Notes

- Only commit `package.json` and `package-lock.json`. Never commit `node_modules/`.
- If `npm audit fix` introduces unexpected changes (e.g., downgrades), review the diff before continuing.
- For packages skipped due to major version bumps, open a separate task or branch — do not bundle with this update.
- Always run the full build + test + lint pipeline before committing.
