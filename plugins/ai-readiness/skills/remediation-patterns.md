# Remediation Patterns

This skill provides common fixes across all audit categories. Reference this when producing actionable coaching recommendations in audit reports.

---

## Priority Ordering Framework

When presenting remediation recommendations, order by **impact-to-effort ratio**:

| Priority | Category | Rationale |
|----------|----------|-----------|
| **P0 — Immediate** | Security critical | Secrets, credentials, critical vulnerabilities — active risk |
| **P1 — This Sprint** | Blocking patterns | Long-lived branches, env branches, cherry-pick promotion |
| **P2 — This Month** | Quality foundations | Test coverage, error handling, type safety |
| **P3 — This Quarter** | Structural improvements | Architecture refactoring, module boundaries |
| **P4 — Ongoing** | Continuous improvement | Naming, docs, style consistency |

---

## Documentation Fixes

### Stale README

**Problem**: README describes outdated setup, architecture, or commands.
**Fix**:
1. Run setup steps from README — note every failure.
2. Update setup instructions to match current reality.
3. Add a "Last verified" date to build/setup sections.
4. Set up CI to run README setup steps periodically.

### Missing CLAUDE.md

**Problem**: No AI instruction file exists.
**Fix**:
1. Create `CLAUDE.md` at project root.
2. Include: project description, tech stack, build/test/run commands, top 5 conventions.
3. Keep under 300 lines. Point to detailed docs rather than embedding content.
4. Structure as WHAT (project overview) → WHY (architecture decisions) → HOW (commands and workflows).
5. Pair prohibitions with alternatives: "Never use X, prefer Y instead."

### Outdated Architecture Docs

**Problem**: Architecture diagrams reference removed components or deprecated patterns.
**Fix**:
1. Cross-reference docs against current `src/` directory structure.
2. Delete references to components that no longer exist.
3. Add dates to architecture documents.
4. Consider auto-generated architecture docs from code structure.

---

## Code Quality Fixes

### Dead Code Removal

**Problem**: Unused files, functions, imports, or commented-out code consuming context.
**Fix**:
1. Run dead code detection (`knip` for JS/TS, `vulture` for Python, `unused` for Go).
2. Delete unused exports, functions, and files.
3. Delete all commented-out code — git has the history.
4. Remove stale TODO/FIXME comments older than 6 months — triage or delete.
5. Add dead code detection to CI pipeline.

### Code Duplication

**Problem**: Copy-paste logic creating forked patterns the AI replicates.
**Fix**:
1. Identify duplicate patterns using tools or manual inspection.
2. Extract shared logic into canonical implementations in `utils/`, `shared/`, or `common/`.
3. Document the canonical patterns in CLAUDE.md.
4. Prioritize deduplication in high-traffic modules (files the AI sees most often).

### Naming Inconsistencies

**Problem**: Mixed conventions (camelCase/snake_case, abbreviations, vague names).
**Fix**:
1. Document naming conventions in CLAUDE.md or a linter config.
2. Pick one convention per context (files, variables, functions, classes).
3. Rename vague identifiers in high-traffic modules first.
4. Enforce with linter rules (eslint naming-convention, pylint naming-style).
5. Fix file naming inconsistencies within each directory.

### Complexity Reduction

**Problem**: Functions > 30 lines, cyclomatic complexity > 10, nesting > 3 levels.
**Fix**:
1. Extract deeply nested conditionals into named helper functions.
2. Replace complex boolean expressions with descriptively named variables.
3. Split large functions along responsibility boundaries.
4. Keep files under 500 lines — split larger files by feature.

---

## Security Fixes

### Secrets Rotation

**Problem**: API keys, tokens, passwords, or connection strings found in code or git history.
**Fix** (in order):
1. **Immediately rotate** the exposed credential — assume it is compromised.
2. Remove from current working tree.
3. Add pattern to `.gitignore` and pre-commit hook.
4. Use `git-filter-repo` or BFG Repo Cleaner to purge from history.
5. Force push to all remotes (coordinate with team).
6. Set up automated secret scanning (gitleaks, trufflehog) in CI.

### Input Validation

**Problem**: Missing server-side validation, unsanitized user input, injection vectors.
**Fix**:
1. Add schema validation for all API request bodies (zod, joi, pydantic).
2. Use parameterized queries — never concatenate user input into SQL.
3. Enable template auto-escaping for HTML output.
4. Validate file uploads (type, size, filename).
5. Add CORS restrictions (no wildcard `*` in production).

### Missing Security Headers

**Problem**: No CSP, HSTS, X-Frame-Options, etc.
**Fix**:
1. Add security headers via middleware (helmet for Express, SecurityHeaders for ASP.NET).
2. Set `Content-Security-Policy` to restrict script/style sources.
3. Set `Strict-Transport-Security` with appropriate max-age.
4. Set `X-Frame-Options: DENY` unless framing is required.

---

## Git Hygiene Fixes

### Commit Message Quality

**Problem**: Messages like "fix", "wip", "update", "asdf".
**Fix**:
1. Adopt conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`).
2. Enforce with a `commit-msg` git hook (commitlint).
3. Squash WIP commits before merging — keep final history clean.
4. Use imperative mood: "Add feature" not "Added feature".

### Branch Cleanup

**Problem**: > 50 stale remote branches, merged but undeleted branches.
**Fix**:
1. Delete merged branches: `git branch -r --merged origin/main | grep -v main | xargs -I{} git push origin --delete {}`.
2. Set up automatic branch deletion after PR merge (GitHub/GitLab setting).
3. Delete branches stale > 90 days after team review.
4. Target: branches live < 24 hours (trunk-based development).

### Long-Lived Branches

**Problem**: Feature branches > 7 days, environment branches.
**Fix**:
1. Move toward trunk-based development with feature flags.
2. Break large features into small, independently deployable increments.
3. Merge to main at least daily.
4. Delete environment branches — use CI/CD pipeline stages instead.

---

## Testing Fixes

### Low Coverage

**Problem**: Insufficient test coverage, especially for critical business logic.
**Fix**:
1. Identify high-traffic modules (files changed most often) — test these first.
2. Write tests for public API boundaries first, not internal implementation.
3. Use behavior-driven test names: `should_return_404_when_user_not_found`.
4. Aim for coverage of code paths, not just lines.
5. For legacy code: start with characterization/approval tests to capture current behavior.

### Assertion Quality

**Problem**: Tests that "pass" but don't verify meaningful behavior.
**Fix**:
1. Every test must have at least one meaningful assertion.
2. Assert specific values, not just truthiness.
3. Test behavior, not implementation details — tests should survive refactoring.
4. Remove tautological tests that can never fail.
5. Add assertion messages that diagnose failures.

### Test Reliability

**Problem**: Flaky tests, time-dependent tests, shared mutable state.
**Fix**:
1. Mock or stub all external dependencies (network, filesystem, clock).
2. Isolate test data — no shared mutable state between tests.
3. Replace `sleep()` with proper async waiting mechanisms.
4. Use test fixtures/factories instead of inline data.
5. Run tests in random order to detect order dependencies.

---

## AI Configuration Fixes

### Missing Ignore Files

**Problem**: No `.claudeignore` / `.cursorignore`, AI processing noise.
**Fix**:
1. Create `.claudeignore` with:
   - Generated files: `dist/`, `build/`, `*.min.js`, `*.bundle.*`
   - Dependencies: `node_modules/`, `vendor/`, `venv/`
   - Lock files: `package-lock.json`, `yarn.lock`, `*.lock`
   - Binaries: `*.png`, `*.jpg`, `*.woff`, `*.ttf`
   - Secrets: `.env*`, `*.pem`, `*.key`, `credentials/`

### Missing Type Safety

**Problem**: Untyped codebase producing poor AI output.
**Fix**:
1. Enable TypeScript strict mode or mypy strict.
2. Add type annotations to public APIs and module boundaries first.
3. Type function signatures before function bodies.
4. Use branded types or newtypes for domain concepts.
5. Every typed function signature is a contract the AI can reason about.

### Hooks Not Enforcing Rules

**Problem**: Critical rules exist only in documentation (advisory), not in hooks (deterministic).
**Fix**:
1. Identify the 3 most important rules from CLAUDE.md.
2. Implement as pre-commit hooks (formatting, lint, test).
3. Use `husky` (Node), `pre-commit` (Python), or git's native hooks.
4. Hooks should fail fast with clear error messages.
5. Move rule from "instruction" to "enforcement" in CLAUDE.md.
