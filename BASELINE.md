# Eval Baseline

Current evaluation metrics for all plugin eval suites. Updated by running evals and recording results with `eval-infra/scripts/record-baseline.sh`.

> **Status**: Baseline not yet recorded. Run `npm run eval:all` followed by `./eval-infra/scripts/record-baseline.sh` to populate.

## How to Update

```bash
# Run all evals
npm run eval:all

# Record baseline
./eval-infra/scripts/record-baseline.sh ai-readiness
./eval-infra/scripts/record-baseline.sh frontend-dev
```

## ai-readiness

| Suite | evalType | pass@1 | pass@3 | pass^3 | Notes |
|-------|----------|--------|--------|--------|-------|
| full-audit | capability | — | — | — | |
| git-health | capability | — | — | — | |
| code-review | capability | — | — | — | |
| architecture | capability | — | — | — | |
| security | capability | — | — | — | |
| testing | capability | — | — | — | |
| api-review | capability | — | — | — | |
| full-audit-neg | regression | — | — | — | |
| git-health-neg | regression | — | — | — | |
| code-review-neg | regression | — | — | — | |
| architecture-neg | regression | — | — | — | |
| security-neg | regression | — | — | — | |
| testing-neg | regression | — | — | — | |
| api-review-neg | regression | — | — | — | |

## frontend-dev

| Suite | evalType | pass@1 | pass@3 | pass^3 | Notes |
|-------|----------|--------|--------|--------|-------|
| scaffolding | capability | — | — | — | |
| a11y | capability | — | — | — | |
| responsive | capability | — | — | — | |
| refactoring | capability | — | — | — | |
| design-system | capability | — | — | — | |
| scaffolding-neg | regression | — | — | — | |
| a11y-neg | regression | — | — | — | |
| refactoring-neg | regression | — | — | — | |

## History

Detailed per-run history is tracked in `evals/<plugin>/eval-history.jsonl`.
