# ai-readiness

Assess how well a codebase supports AI coding assistants. Audits code quality, git health, security, testing, architecture, and API design — producing scored reports with actionable remediation guidance.

## Commands

### `/ai-readiness:full-audit`
Comprehensive 10-section AI readiness audit covering documentation accuracy, code comments, naming conventions, DRY compliance, project structure, dependency clarity, test quality, security posture, git hygiene, and AI-specific configuration. Uses severity ratings (🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low / ✅ Pass) with evidence-backed findings and coaching fixes.

### `/ai-readiness:git-health`
Detects 71 git anti-patterns across 10 categories with DORA-derived severity scoring. Runs git commands to analyze branching patterns, commit hygiene, CI/CD indicators, collaboration signals, history rewriting, code quality forensics, release patterns, repository health, and commit message quality. Produces a score mapped to DORA performance levels (Elite / High / Medium / Low / Crisis).

### `/ai-readiness:code-review`
7-category weighted code review (pass ≥ 75): Naming (10%), Duplication (15%), Error Handling (20%), Complexity (20%), Dead Code (10%), Language Best Practices (15%), Style Consistency (10%). Adapts to detected language.

### `/ai-readiness:architecture`
6-category architecture review with SOLID principles (pass ≥ 75): Layering (25%), Dependency Management (20%), Design Patterns (20%), Module Boundaries (15%), SOLID (10%), Scalability (10%). Detects god classes, circular dependencies, and anti-patterns.

### `/ai-readiness:security`
6-category security review with OWASP Top 10 mapping (pass ≥ 80, **auto-fail on any Critical**): Injection (25%), Auth (25%), Secrets (20%), Input Validation (15%), Security Config (10%), Crypto (5%). Includes CWE references and remediation priority.

### `/ai-readiness:testing`
Test quality assessment merging two frameworks — 6-category testing patterns (Coverage 25%, Quality 25%, Naming 10%, Reliability 20%, Mocks 10%, Maintainability 10%) plus Test Desiderata 2.0 macro goals and testing pyramid shape analysis. Includes conditional legacy system detection with recovery strategies.

### `/ai-readiness:api-review`
7-category API design review (pass ≥ 75): REST Conventions (20%), Status Codes (20%), Schema Consistency (20%), Contract & Docs (15%), Versioning (10%), Pagination (10%), Idempotency (5%). Produces endpoint inventory and consistency matrix.

## Agent

### `readiness-auditor`
Evidence-first auditor that orchestrates the full assessment. Reads the repo structure first, decides which audits apply based on a decision tree, runs relevant commands, and produces a unified report combining all results. Prioritizes findings by impact-to-effort ratio.

## Skills

### `ai-context-principles`
Knowledge about AI context windows, signal-to-noise ratio, token budgets, and strategies for maximizing AI output quality. Cites research (10% noise = 23% accuracy drop).

### `dora-metrics`
DORA metrics knowledge — four key metrics, Elite/High/Medium/Low performance bands, and how git patterns correlate with delivery performance. Based on *Accelerate* research.

### `scoring-methodology`
Unified scoring methodology across all commands — weighted category scoring, severity levels, pass/fail thresholds, auto-fail conditions, and computation procedures.

### `remediation-patterns`
Common fixes across all audit categories — documentation, code quality, security, git hygiene, testing, and AI configuration. Organized by priority ordering framework (P0–P4).

## Installation

Add to your Claude Code project's `.claude/settings.json`:

```json
{
  "plugins": ["path/to/plugins/ai-readiness"]
}
```

## Usage Examples

Run a full assessment:
```
/ai-readiness:full-audit
```

Check git delivery health:
```
/ai-readiness:git-health
```

Review code quality:
```
/ai-readiness:code-review
```

Security scan with OWASP mapping:
```
/ai-readiness:security
```

Use the agent for an orchestrated multi-audit:
```
Ask the readiness-auditor agent to assess this repository
```

## Scoring Quick Reference

| Command | Pass | Categories | Special Rules |
|---------|------|-----------|---------------|
| code-review | ≥ 75 | 7 weighted | — |
| architecture | ≥ 75 | 6 weighted | — |
| security | ≥ 80 | 6 weighted | Auto-fail on Critical |
| testing | ≥ 75 | 6 weighted | Legacy detection |
| api-review | ≥ 75 | 7 weighted | — |
| git-health | 0–75 = Elite | 71 anti-patterns | DORA severity weights |
| full-audit | Per-section ratings | 10 sections | 5-tier severity |
