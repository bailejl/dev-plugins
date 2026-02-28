# AI Readiness Codebase Audit

You are performing an opinionated, comprehensive audit of this codebase to assess how well it supports AI coding assistants — specifically tools like Claude Code, Cursor, GitHub Copilot, and similar LLM-powered agents. Your goal is to identify issues that degrade AI performance, create security risks, or cause the AI to produce low-quality output — and to coach the team on how to fix them.

## Why This Audit Matters

AI coding assistants don't just read your code — they absorb it. Every file, comment, naming pattern, and documentation artifact becomes part of the context window, shaping the AI's understanding and output. Research shows:

- Adding just 10% irrelevant content to prompts reduces AI accuracy by 23%
- Even with perfect retrieval of relevant information, performance drops 13.9–85% as input length grows
- LLMs can track at most 5–10 variables before performance degrades to random guessing
- AI models interpret existing codebase patterns as implicit instructions — messy code breeds more messy code
- Codebases are a proven prompt injection attack surface, with attack success rates reaching 41–84%

A codebase that is "AI-ready" is not just clean code — it is code that is structured, documented, and maintained in ways that maximize the signal-to-noise ratio in an AI's context window.

---

## Audit Methodology

Conduct this audit in the following order. For each section, produce:

1. **A severity-rated finding** (🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low / ✅ Pass)
2. **Evidence** — cite specific files, lines, patterns, or git history
3. **Impact on AI** — explain *why* this degrades AI assistant performance
4. **Coaching fix** — actionable, specific guidance on how to resolve it

Use tools (`grep`, `glob`, `find`, `git log`, `git diff`, `wc`, etc.) aggressively to gather evidence. Do not guess — measure.

---

## Section 1: Documentation Accuracy & Freshness

Documentation files (README.md, CONTRIBUTING.md, docs/) are treated by AI models as authoritative project rules. Stale or contradictory documentation poisons the AI's understanding of the entire project.

### What to check:

- **README.md**: Does it accurately describe the current project structure, setup steps, and architecture? Run the setup steps mentally or via script — do they still work?
- **CONTRIBUTING.md**: Are the contribution guidelines current? Do they reference tools, workflows, or branches that still exist?
- **Inline docs (JSDoc, docstrings, Javadoc, etc.)**: Sample 10–15 functions across the codebase. Do the parameter descriptions, return types, and usage examples match the actual implementation?
- **Architecture docs**: Do any architecture diagrams or documents reference components, services, or patterns that have been removed or replaced?
- **Git history check**: Run `git log --diff-filter=M --name-only -- README.md CONTRIBUTING.md docs/` and compare the last modification date of documentation files against the last modification date of the code they describe. Flag documentation that hasn't been updated in 6+ months while its related code has changed significantly.

### Why it matters for AI:

AI models treat README and CONTRIBUTING.md content as workflow rules. When those documents say "run `make build`" but the project now uses `npm run build`, the AI will confidently use the wrong command. Outdated architecture docs cause the AI to reference components that no longer exist or to follow deprecated patterns.

---

## Section 2: Code Comment Quality

Comments are among the easiest places to inject context pollution — both intentionally and accidentally. The AI reads every comment with the same attention weight as code.

### What to check:

- **Commented-out code**: Search for large blocks of commented-out code (`grep -rn "^[[:space:]]*//" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.go" --include="*.rs" | head -100`). Quantify the volume.
- **TODO/FIXME/HACK archaeology**: Run `grep -rn "TODO\|FIXME\|HACK\|XXX\|DEPRECATED" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.go" --include="*.rs"`. Cross-reference with `git log --format="%H %ai" -1 -- <file>` to find TODOs older than 6 months. These are dead tasks that clutter AI context.
- **Misleading comments**: Sample 10–15 comments that describe logic. Does the code actually do what the comment says? Look especially at comments near code that has been refactored.
- **Noise comments**: Identify trivial comments that restate the code (e.g., `// increment counter` above `counter++`). These consume context tokens with zero informational value.
- **Git history check**: Use `git log -p --diff-filter=M` on files with high comment density. Look for patterns where code was changed but adjacent comments were not updated.

### Coaching:

- **Commented-out code**: Delete it. Git has it. If you need it back, `git log -S "the code"` will find it. Every line of commented-out code is a line of noise the AI must process.
- **Stale TODOs**: Triage them now — either do them, create tickets and remove the comment, or delete them if they're no longer relevant.
- **Misleading comments**: A wrong comment is worse than no comment. Fix or delete.
- **Noise comments**: Delete comments that merely describe what the code does. Keep comments that explain *why* — intent, business rules, non-obvious constraints.

---

## Section 3: Naming Conventions & Consistency

AI models exhibit "training data gravity" — they pattern-match on what they see in context. Inconsistent naming conventions in your codebase become inconsistent naming in AI-generated code.

### What to check:

- **Naming convention consistency**: Are files, functions, variables, and classes following a single convention? (e.g., `camelCase` vs `snake_case` vs `PascalCase`). Check for mixing within the same layer or module.
- **Semantic naming**: Do names convey intent? Search for generic names: `grep -rn "data\|temp\|tmp\|result\|val\|item\|obj\|thing\|stuff\|handle\|process\|do[A-Z]" --include="*.ts" --include="*.js" --include="*.py"`. High counts indicate the AI will generate similarly vague names.
- **File naming patterns**: Are file names consistent? (e.g., `UserService.ts` vs `user-service.ts` vs `userService.ts` in the same directory).
- **Boolean naming**: Are booleans named as predicates? (`isActive`, `hasPermission`, `canEdit` vs `active`, `permission`, `edit`).
- **Abbreviation consistency**: Does the codebase use `btn` and `button`, `msg` and `message`, `req` and `request` interchangeably?

### Coaching:

- Pick one convention per context (files, variables, functions, classes) and document it. Then enforce it with a linter rule. Don't rely on the AI to infer your convention — it will average across everything it sees.
- Rename vague identifiers in high-traffic modules first. The AI weights recent and frequently-seen files more heavily.

---

## Section 4: DRY Compliance & Pattern Consistency

Research shows AI-driven development is "already degrading code quality" by systematically violating DRY. Existing duplication in your codebase makes this exponentially worse — the AI sees the pattern and replicates it.

### What to check:

- **Copy-paste duplication**: Use language-appropriate tools or manual inspection to identify duplicated logic blocks. Look for nearly-identical functions, repeated error handling patterns, and duplicated validation logic.
- **Multiple ways to do the same thing**: Are there multiple HTTP clients, multiple logging approaches, multiple config-loading patterns? List them.
- **Inconsistent patterns across layers**: Does the API layer use one error handling style while the service layer uses another? Does module A use callbacks while module B uses async/await?
- **Git history check**: Run `git log --all --oneline --since="6 months ago" | wc -l` to gauge velocity. Then look at recent PRs/commits for signs of AI-generated duplication: large commits that add significant new code without refactoring existing code.

### Coaching:

- Every duplicated pattern is a fork in the road for the AI. Consolidate into canonical implementations and reference them from a central location (a `utils/`, `shared/`, or `common/` directory).
- Document the "one right way" in the project's CLAUDE.md or equivalent. But remember: documentation is advisory. For truly critical patterns, enforce with linter rules or shared libraries.

---

## Section 5: Project Structure & Module Organization

The AI navigates your codebase by reading file paths and directory structures. A clear, predictable structure means the AI can find what it needs without loading unnecessary files into context.

### What to check:

- **Directory depth and breadth**: Run `find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './venv/*' | awk -F/ '{print NF-1}' | sort -n | tail -20` to find the deepest nested files. Depth > 6 is a smell.
- **Co-location**: Are related files grouped together? Or is the project organized by type (all controllers in one folder, all models in another) rather than by feature/domain?
- **Barrel files / index files**: Are there index files that re-export everything? These can balloon imports and confuse AI understanding of dependencies.
- **Circular dependencies**: Check for circular import patterns. These are especially confusing for AI reasoning about code flow.
- **File size**: Run `find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.java" -o -name "*.go" | xargs wc -l | sort -rn | head -20`. Files over 500 lines are harder for AI to reason about. Files over 1,000 lines will reliably degrade quality.
- **Dead code / unused files**: Identify files not imported or referenced anywhere. Check with `git log --since="1 year ago" -- <file>` — if a file hasn't been touched in a year and isn't a config/build artifact, it may be dead weight.

### Coaching:

- Large files should be split along responsibility boundaries. The AI works best when each file has a single, clear purpose.
- Dead files should be deleted. They consume context tokens during search operations and can mislead the AI about which patterns are current.
- Prefer feature/domain-based organization over type-based organization. When the AI needs to work on the "payments" feature, it should be able to find everything in `src/payments/` rather than hunting across `controllers/`, `models/`, `services/`, `tests/`.

---

## Section 6: Dependency & Configuration Clarity

Unclear dependencies and opaque configuration are invisible walls the AI runs into. It generates code that looks right but fails at runtime.

### What to check:

- **Dependency documentation**: Is there a clear explanation of major dependencies and why they were chosen? Or is the `package.json` / `requirements.txt` / `go.mod` the only source of truth?
- **Version pinning**: Are dependencies pinned to exact versions, ranges, or floating? Floating versions mean the AI may generate code for a different version than what's installed.
- **Environment configuration**: How many environment variables does the project require? Are they documented? Is there an `.env.example` or equivalent? The AI cannot infer runtime configuration.
- **Build configuration complexity**: How many build configs exist? (Webpack, Babel, TypeScript, ESLint, Prettier, etc.) Excessive configuration files consume context and create conflicting signals.
- **Internal vs external API contracts**: Are internal APIs (between services, modules) documented with types, interfaces, or schemas? The AI cannot reason about an API it can't see the contract for.

### Coaching:

- Create an `.env.example` with every required variable, a description, and a safe default value. This single file dramatically improves AI-generated setup scripts and configurations.
- Document non-obvious dependency choices in a `DECISIONS.md` or `ADR/` directory. When the AI sees `lodash` and `ramda` both imported, it needs to know which one to use going forward.

---

## Section 7: Test Quality & Coverage

Tests are the AI's best teacher. Well-written tests demonstrate expected behavior, edge cases, and the "right" way to use your code. Poor tests (or no tests) remove this entire learning signal.

### What to check:

- **Test existence**: What percentage of source files have corresponding test files? Run a count.
- **Test quality**: Sample 5–10 test files. Do they test behavior or implementation details? Are they readable as documentation?
- **Test naming**: Do test names describe the expected behavior? (`it('should return 404 when user not found')` vs `it('test1')`).
- **Fixture and mock quality**: Are test fixtures realistic? Do mocks match actual API contracts? Unrealistic mocks teach the AI incorrect patterns.
- **Test patterns**: Is there a consistent test structure (Arrange/Act/Assert, Given/When/Then)? Or does every test file use a different approach?
- **Git history check**: Run `git log --oneline --since="3 months ago" -- "**/*test*" "**/*spec*" | wc -l` vs `git log --oneline --since="3 months ago" | wc -l`. What percentage of recent commits touch tests? A low ratio suggests tests are an afterthought.

### Coaching:

- Tests are documentation that the AI can execute mentally. Invest in test readability. A test file that reads like a specification is worth more than a 500-line README.
- Prioritize adding tests to high-traffic modules — the files the AI is most likely to be asked to modify. One well-written test file in a critical module teaches the AI more than scattered tests across the whole codebase.

---

## Section 8: Security Posture for AI Assistants

Your codebase is an attack surface when AI reads it. Prompt injection via code comments, configs, and documentation is a proven, actively exploited vulnerability.

### What to check:

- **Secrets in code**: Search for hardcoded API keys, tokens, passwords, and connection strings. `grep -rn "api_key\|apikey\|secret\|password\|token\|private_key\|AWS_ACCESS\|AKIA" --include="*.ts" --include="*.js" --include="*.py" --include="*.env" --include="*.json" --include="*.yaml" --include="*.yml"`. Also check git history: `git log -p -S "password" --all -- "*.ts" "*.js" "*.py" "*.env"`.
- **Sensitive files without AI exclusion**: Does the project have a `.claudeignore` (or equivalent `.cursorignore`, `.copilotignore`)? Are sensitive directories (credentials, internal configs, production secrets) excluded?
- **Suspicious comments or hidden content**: Scan for unusual Unicode characters in comments and markdown files that could hide prompt injection payloads. `grep -rPn '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{FEFF}]' .` (zero-width joiners, bidirectional markers, etc.).
- **Overly permissive agent configs**: If the project has `.cursorrules`, `.github/copilot-instructions.md`, `CLAUDE.md`, or similar files, do they come from a trusted source? Have they been reviewed for injection content?
- **Command injection surfaces**: Look for pre-approved shell commands, git hooks, or Makefile targets that an AI agent might invoke. Could any of them be manipulated through codebase content?

### Coaching:

- Create a `.claudeignore` immediately. Exclude: `.env*`, `secrets/`, `credentials/`, `*.pem`, `*.key`, any directory containing production configuration.
- Review all AI instruction files (`.cursorrules`, `CLAUDE.md`, etc.) as security-sensitive documents. They should be owned, reviewed, and version-controlled with the same rigor as CI/CD configs.
- Never store secrets in code. Use a secrets manager. If secrets have ever been committed, rotate them — git history is permanent and AI tools can access it.

---

## Section 9: Git History Hygiene

AI assistants increasingly use git history to understand project evolution, conventions, and patterns. A messy git history teaches messy habits.

### What to check:

- **Commit message quality**: Run `git log --oneline -50` and assess. Are messages descriptive? Or are they `fix`, `wip`, `update`, `stuff`, `asdf`?
- **Commit granularity**: Look at recent commits with `git log --stat -20`. Are commits atomic (one logical change per commit) or do they bundle unrelated changes?
- **Merge vs rebase hygiene**: Is the git graph clean and readable, or is it a tangle of merge commits?
- **Large binary files**: Run `git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '$1 == "blob" && $3 > 1048576 {print $3, $4}' | sort -rn | head -10` to find files over 1MB in history. Large binaries bloat the repository and can waste context.
- **Force-push / history rewrite evidence**: Check for signs of rebased or squashed history that may have removed context the AI could use.
- **Branch naming conventions**: Are branches named consistently? (`feature/`, `fix/`, `chore/` vs random names).

### Coaching:

- Adopt conventional commits (e.g., `feat:`, `fix:`, `refactor:`, `docs:`) and enforce with a commit-msg hook. This gives AI assistants structured metadata about what each change does.
- Squash WIP commits before merging. The AI doesn't need to see your iterative debugging — it needs to see the final, intentional change.

---

## Section 10: AI-Specific Configuration

How well is the codebase configured for AI coding assistant workflows specifically?

### What to check:

- **CLAUDE.md / AI instruction files**: Does one exist? If so, assess it against these criteria:
  - Is it under 300 lines? (Longer files get ignored as context grows)
  - Does every instruction apply universally? (Project-specific instructions should use progressive disclosure — point to docs rather than embedding content)
  - Does it follow WHAT/WHY/HOW structure? (What the project is, why components exist, how to build/test/deploy)
  - Are prohibitions paired with alternatives? ("Never use X, prefer Y instead" — naked prohibitions stall the AI)
  - Are critical rules enforced via hooks rather than instructions? (Instructions are advisory; hooks are deterministic)
- **Hooks and enforcement**: Are there pre-commit hooks, pre-push hooks, or CI checks that enforce the rules that matter most? (formatting, test passage, lint compliance). If rules exist only in documentation, they will be violated.
- **.claudeignore / .cursorignore**: Does one exist? Does it exclude generated files, vendor directories, lock files, and other high-volume, low-signal content?
- **Type safety**: Does the project use TypeScript, mypy, Go's type system, or equivalent? Type information is one of the highest-value signals for AI code generation. Untyped codebases produce significantly worse AI output.

### Coaching:

- If no CLAUDE.md exists, create one. Start minimal: project description, tech stack, build/test/run commands, top 5 conventions. Grow it only as needed.
- Move your most critical rules from CLAUDE.md to hooks. If "always run tests before committing" is important, make it a pre-commit hook — not a CLAUDE.md instruction.
- Add type annotations progressively, starting with public APIs and module boundaries. Every typed function signature is a contract the AI can reason about.

---

## Report Output Format

After completing all sections, produce a summary report with the following structure:

### Executive Summary

A 3–5 sentence overall assessment of the codebase's AI readiness. State the most critical finding and the single highest-leverage improvement.

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

Rank the top 5 fixes by impact-to-effort ratio. For each, provide:

1. **What**: The specific change
2. **Why**: How it improves AI performance (cite the research)
3. **How**: Step-by-step instructions to implement it
4. **Effort**: Estimated time (hours/days)
5. **Impact**: Expected improvement in AI output quality

### Detailed Findings

The full section-by-section findings with evidence, impact analysis, and coaching as described above.

### Context Budget Analysis

Estimate the codebase's "context cost" — how many tokens of noise vs signal the AI must process for a typical task. Identify the biggest token sinks (generated files, vendor code, commented-out code, stale docs) and quantify the potential savings from cleanup.

---

## Operating Principles

- **Be opinionated**: This audit should have a clear point of view. "It depends" is not a finding. State what should change and why.
- **Show evidence**: Every finding must cite specific files, line numbers, git commits, or measurable patterns. No hand-waving.
- **Coach, don't lecture**: Pair every criticism with a concrete, actionable fix. Include commands, file paths, and examples where possible.
- **Prioritize ruthlessly**: Not everything needs to be fixed today. Make it clear what matters most and what can wait.
- **Think like the AI**: For every issue, explain *how* it specifically degrades the AI's context window, attention allocation, or pattern matching. This is not a generic code quality audit — it is specifically about AI readiness.
