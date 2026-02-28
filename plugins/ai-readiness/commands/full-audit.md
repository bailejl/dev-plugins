# Comprehensive AI Readiness Audit

You are performing an opinionated, comprehensive audit of this codebase to assess how well it supports AI coding assistants — specifically tools like Claude Code, Cursor, GitHub Copilot, and similar LLM-powered agents. Your goal is to identify issues that degrade AI performance, create security risks, or cause the AI to produce low-quality output — and to coach the team on how to fix them.

---

## Why This Audit Matters

AI coding assistants don't just read your code — they absorb it. Every file, comment, naming pattern, and documentation artifact becomes part of the context window, shaping the AI's understanding and output. Research shows:

- Adding just **10% irrelevant content** to prompts reduces AI accuracy by **23%**
- Even with perfect retrieval of relevant information, performance drops **13.9–85%** as input length grows
- LLMs can track at most **5–10 variables** before performance degrades to random guessing
- AI models interpret existing codebase patterns as **implicit instructions** — messy code breeds more messy code
- Codebases are a proven **prompt injection attack surface**, with attack success rates reaching **41–84%**

A codebase that is "AI-ready" is not just clean code — it is code that is structured, documented, and maintained in ways that maximize the **signal-to-noise ratio** in an AI's context window.

---

## Audit Methodology

Conduct this audit in the following order. For each section, produce:

1. **A severity-rated finding** (🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low / ✅ Pass)
2. **Evidence** — cite specific files, lines, patterns, or git history
3. **Impact on AI** — explain *why* this degrades AI assistant performance
4. **Coaching fix** — actionable, specific guidance on how to resolve it

Use tools (`grep`, `glob`, `find`, `git log`, `git diff`, `wc`, etc.) aggressively to gather evidence. **Do not guess — measure.**

---

## Section 1: Documentation Accuracy & Freshness

Documentation files (README.md, CONTRIBUTING.md, docs/) are treated by AI models as authoritative project rules. Stale or contradictory documentation poisons the AI's understanding.

### What to check:

- **README.md**: Does it accurately describe the current project structure, setup steps, and architecture? Run the setup steps mentally or via script — do they still work?
- **CONTRIBUTING.md**: Are the contribution guidelines current? Do they reference tools, workflows, or branches that still exist?
- **Inline docs (JSDoc, docstrings, Javadoc, etc.)**: Sample 10–15 functions across the codebase. Do parameter descriptions, return types, and usage examples match the actual implementation?
- **Architecture docs**: Do any architecture diagrams or documents reference components, services, or patterns that have been removed or replaced?
- **Git history check**: Run `git log --diff-filter=M --name-only -- README.md CONTRIBUTING.md docs/` and compare last modification dates of documentation files against the code they describe. Flag documentation not updated in 6+ months while its related code changed significantly.

### Why it matters for AI:

AI models treat README and CONTRIBUTING.md content as workflow rules. When those documents say "run `make build`" but the project now uses `npm run build`, the AI will confidently use the wrong command. Outdated architecture docs cause the AI to reference components that no longer exist.

---

## Section 2: Code Comment Quality

Comments are among the easiest places to inject context pollution — both intentionally and accidentally. The AI reads every comment with the same attention weight as code.

### What to check:

- **Commented-out code**: Search for large blocks of commented-out code. Quantify the volume.
  ```
  grep -rn "^[[:space:]]*//" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.go" --include="*.rs" | wc -l
  ```
- **TODO/FIXME/HACK archaeology**: Search for stale markers and cross-reference with `git log` to find TODOs older than 6 months.
  ```
  grep -rn "TODO\|FIXME\|HACK\|XXX\|DEPRECATED" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.go" --include="*.rs"
  ```
- **Misleading comments**: Sample 10–15 comments that describe logic. Does the code actually do what the comment says?
- **Noise comments**: Identify trivial comments that restate the code (e.g., `// increment counter` above `counter++`). These consume context tokens with zero informational value.

### Coaching:

- **Commented-out code**: Delete it. Git has it. Every line of commented-out code is a line of noise the AI must process.
- **Stale TODOs**: Triage now — either do them, create tickets and remove the comment, or delete.
- **Misleading comments**: A wrong comment is worse than no comment. Fix or delete.
- **Noise comments**: Delete comments that describe *what*. Keep comments that explain *why*.

---

## Section 3: Naming Conventions & Consistency

AI models exhibit "training data gravity" — they pattern-match on what they see in context. Inconsistent naming in your codebase becomes inconsistent naming in AI-generated code.

### What to check:

- **Naming convention consistency**: Are files, functions, variables, and classes following a single convention? Check for mixing within the same layer or module.
- **Semantic naming**: Search for generic names:
  ```
  grep -rn "data\|temp\|tmp\|result\|val\|item\|obj\|thing\|stuff\|handle\|process\|do[A-Z]" --include="*.ts" --include="*.js" --include="*.py"
  ```
- **File naming patterns**: Are file names consistent within each directory?
- **Boolean naming**: Are booleans named as predicates? (`isActive`, `hasPermission` vs `active`, `permission`)
- **Abbreviation consistency**: Does the codebase use `btn` and `button`, `msg` and `message` interchangeably?

### Coaching:

- Pick one convention per context and document it. Enforce with a linter rule.
- Rename vague identifiers in high-traffic modules first. The AI weights recent and frequently-seen files more heavily.

---

## Section 4: DRY Compliance & Pattern Consistency

Research shows AI-driven development is "already degrading code quality" by systematically violating DRY. Existing duplication makes this exponentially worse.

### What to check:

- **Copy-paste duplication**: Identify duplicated logic blocks, repeated error handling patterns, duplicated validation logic.
- **Multiple ways to do the same thing**: Are there multiple HTTP clients, multiple logging approaches, multiple config-loading patterns?
- **Inconsistent patterns across layers**: Does the API layer use one error handling style while the service layer uses another?
- **Git history check**: Look at recent commits for signs of AI-generated duplication — large commits adding significant new code without refactoring existing code.

### Coaching:

- Consolidate duplicated patterns into canonical implementations.
- Document the "one right way" in CLAUDE.md. For critical patterns, enforce with linter rules.

---

## Section 5: Project Structure & Module Organization

The AI navigates your codebase by reading file paths and directory structures. A clear, predictable structure means the AI can find what it needs without loading unnecessary files.

### What to check:

- **Directory depth**: Find the deepest nested files. Depth > 6 is a smell.
  ```
  find . -type f -not -path './.git/*' -not -path './node_modules/*' | awk -F/ '{print NF-1}' | sort -n | tail -20
  ```
- **Co-location**: Are related files grouped together by feature/domain?
- **Barrel files / index files**: Are there index files that re-export everything, bloating imports?
- **Circular dependencies**: Check for circular import patterns.
- **File size**: Files over 500 lines are harder for AI; over 1,000 lines reliably degrade quality.
  ```
  find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.java" -o -name "*.go" \) | xargs wc -l | sort -rn | head -20
  ```
- **Dead files**: Files not imported or referenced anywhere, not touched in a year.

### Coaching:

- Split large files along responsibility boundaries.
- Delete dead files — they consume context during search operations.
- Prefer feature/domain-based organization over type-based.

---

## Section 6: Dependency & Configuration Clarity

Unclear dependencies and opaque configuration are invisible walls the AI runs into.

### What to check:

- **Dependency documentation**: Is there a clear explanation of major dependencies and why they were chosen?
- **Version pinning**: Are dependencies pinned to exact versions, ranges, or floating?
- **Environment configuration**: How many environment variables are required? Are they documented? Is there an `.env.example`?
- **Build configuration complexity**: How many build configs exist? Excessive configs create conflicting signals.
- **Internal API contracts**: Are internal APIs documented with types, interfaces, or schemas?

### Coaching:

- Create an `.env.example` with every required variable, description, and safe default.
- Document non-obvious dependency choices in `DECISIONS.md` or `ADR/` directory.

---

## Section 7: Test Quality & Coverage

Tests are the AI's best teacher. Well-written tests demonstrate expected behavior, edge cases, and the "right" way to use code.

### What to check:

- **Test existence**: What percentage of source files have corresponding test files?
- **Test quality**: Sample 5–10 test files. Do they test behavior or implementation details?
- **Test naming**: Do test names describe expected behavior?
- **Fixture quality**: Are test fixtures realistic? Do mocks match actual API contracts?
- **Test patterns**: Is there a consistent test structure (Arrange/Act/Assert)?
- **Git history check**: What percentage of recent commits touch tests?
  ```
  git log --oneline --since="3 months ago" -- "**/*test*" "**/*spec*" | wc -l
  git log --oneline --since="3 months ago" | wc -l
  ```

### Coaching:

- Tests are documentation the AI can execute mentally. Invest in test readability.
- Prioritize tests in high-traffic modules — files the AI is most likely asked to modify.

---

## Section 8: Security Posture for AI Assistants

Your codebase is an attack surface when AI reads it. Prompt injection via code comments, configs, and documentation is proven and actively exploited.

### What to check:

- **Secrets in code**: Search for hardcoded API keys, tokens, passwords, connection strings.
  ```
  grep -rn "api_key\|apikey\|secret\|password\|token\|private_key\|AWS_ACCESS\|AKIA" --include="*.ts" --include="*.js" --include="*.py" --include="*.env" --include="*.json" --include="*.yaml" --include="*.yml"
  ```
  Also check git history: `git log -p -S "password" --all -- "*.ts" "*.js" "*.py" "*.env"`
- **AI exclusion files**: Does the project have `.claudeignore`, `.cursorignore`, `.copilotignore`? Are sensitive directories excluded?
- **Suspicious hidden content**: Scan for unusual Unicode characters in comments and markdown that could hide prompt injection payloads.
  ```
  grep -rPn '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{FEFF}]' .
  ```
- **Agent config review**: If `.cursorrules`, `CLAUDE.md`, or similar files exist, have they been reviewed for injection content?
- **Command injection surfaces**: Look for pre-approved shell commands, git hooks, or Makefile targets an AI might invoke.

### Coaching:

- Create a `.claudeignore` immediately. Exclude: `.env*`, `secrets/`, `credentials/`, `*.pem`, `*.key`.
- Review all AI instruction files as security-sensitive documents.
- Never store secrets in code. If secrets have been committed, rotate them — git history is permanent.

---

## Section 9: Git History Hygiene

AI assistants increasingly use git history to understand project evolution and conventions.

### What to check:

- **Commit message quality**: Run `git log --oneline -50` and assess. Descriptive or `fix`, `wip`, `stuff`?
- **Commit granularity**: Are commits atomic or do they bundle unrelated changes? `git log --stat -20`
- **Merge hygiene**: Is the git graph clean or tangled with merge commits?
- **Large binary files**: Find files over 1MB in history.
- **Branch naming**: Consistent naming? (`feature/`, `fix/`, `chore/` vs random names)

### Coaching:

- Adopt conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`) and enforce with a commit-msg hook.
- Squash WIP commits before merging.

---

## Section 10: AI-Specific Configuration

How well is the codebase configured for AI coding assistant workflows specifically?

### What to check:

- **CLAUDE.md / AI instruction files**: Does one exist? If so, assess:
  - Is it under 300 lines?
  - Does every instruction apply universally?
  - Does it follow WHAT/WHY/HOW structure?
  - Are prohibitions paired with alternatives? ("Never use X, prefer Y instead")
  - Are critical rules enforced via hooks rather than instructions?
- **Hooks and enforcement**: Are there pre-commit hooks, CI checks that enforce the rules that matter most?
- **.claudeignore / .cursorignore**: Does one exist? Does it exclude generated files, vendor directories, lock files?
- **Type safety**: Does the project use TypeScript, mypy, Go's type system, or equivalent? Type information is one of the highest-value signals for AI code generation.

### Coaching:

- If no CLAUDE.md exists, create one. Start minimal: project description, tech stack, build/test/run commands, top 5 conventions.
- Move critical rules from CLAUDE.md to hooks.
- Add type annotations progressively, starting with public APIs and module boundaries.

---

## Report Output Format

After completing all 10 sections, produce:

### Executive Summary

A 3–5 sentence overall assessment. State the most critical finding and the single highest-leverage improvement.

### Scorecard

| Section | Rating | Key Finding |
|---------|--------|-------------|
| 1. Documentation Accuracy | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 2. Code Comment Quality | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 3. Naming Conventions | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 4. DRY Compliance | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 5. Project Structure | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 6. Dependency Clarity | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 7. Test Quality | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 8. Security Posture | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 9. Git History Hygiene | 🔴/🟠/🟡/🔵/✅ | One-line summary |
| 10. AI Configuration | 🔴/🟠/🟡/🔵/✅ | One-line summary |

### Priority Actions

Rank the top 5 fixes by impact-to-effort ratio. For each:

1. **What**: The specific change
2. **Why**: How it improves AI performance (cite the research)
3. **How**: Step-by-step instructions
4. **Effort**: Estimated scope (small/medium/large)
5. **Impact**: Expected improvement in AI output quality

### Detailed Findings

Full section-by-section findings with evidence, impact analysis, and coaching as described above.

### Context Budget Analysis

Estimate the codebase's "context cost" — how many tokens of noise vs signal the AI must process for a typical task. Identify the biggest token sinks (generated files, vendor code, commented-out code, stale docs) and quantify potential savings from cleanup.

---

## Operating Principles

- **Be opinionated**: State what should change and why. "It depends" is not a finding.
- **Show evidence**: Every finding must cite specific files, line numbers, git commits, or measurable patterns.
- **Coach, don't lecture**: Pair every criticism with a concrete, actionable fix. Include commands, file paths, and examples.
- **Prioritize ruthlessly**: Not everything needs fixing today. Make it clear what matters most.
- **Think like the AI**: For every issue, explain *how* it specifically degrades the AI's context window, attention allocation, or pattern matching. This is not a generic code quality audit — it is specifically about AI readiness.
