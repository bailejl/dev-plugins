# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A Claude Code plugin monorepo with two plugins (`frontend-dev`, `ai-readiness`) and a shared eval infrastructure for eval-driven prompt development. Plugins ship to users; evals stay in the repo.

## Commands

```bash
# Install dependencies
npm install

# Run evals (requires ANTHROPIC_API_KEY in .env)
npm run eval:frontend          # frontend-dev plugin only
npm run eval:readiness         # ai-readiness plugin only
npm run eval:all               # all plugins

# View results
npx promptfoo view             # interactive web UI

# Compute pass@k metrics
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/frontend-dev/.promptfoo/output.json --k 1 3 5

# Record baseline after a run
./eval-infra/scripts/record-baseline.sh frontend-dev

# View failed transcripts
./eval-infra/scripts/transcript-viewer.sh evals/frontend-dev/.promptfoo

# Validate plugin structure
./eval-infra/scripts/validate-plugin.sh frontend-dev

# Lint and format
npm run lint
npm run format:check
```

## Architecture

```
plugins/<name>/                  # Ships to users — no Node deps
  .claude-plugin/plugin.json     # Manifest (name, version, description)
  commands/*.md                  # Slash commands (YAML frontmatter + instructions)
  agents/*.md                    # Orchestration agents
  skills/*/SKILL.md              # Knowledge bases

evals/<name>/                    # Stays in repo — per-plugin eval harness
  promptfooconfig.yaml           # Extends eval-infra/promptfoo-base.yaml pattern
  suites/*.yaml                  # Test cases (positive + negative pairs)
  graders/deterministic/*.js     # JS graders returning {pass, reason}
  graders/transcript/*.js        # Agent process validation
  graders/llm-rubrics/*.md       # LLM-as-judge rubric templates
  fixtures/                      # Realistic test input projects
  reference-solutions/           # Gold-standard expected outputs

eval-infra/                      # Shared across all plugins
  promptfoo-base.yaml            # Canonical base config (model, timeout, defaults)
  grader-lib/                    # Shared graders (build-check.sh, transcript-utils.js)
  rubric-templates/              # Shared LLM rubric templates
  scripts/                       # run-plugin-evals.sh, compute-pass-at-k.py, etc.
```

## Eval System

- **Provider**: `claude-sonnet-4-20250514`, temperature 0, 16384 max tokens, 300s timeout
- **Test suites** are YAML arrays of cases. Each case has `metadata` (suite, case, evalType, source), `vars` (fixture, prompt), and `assert` (graders).
- **evalType**: `capability` = positive test (should find issues), `regression` = negative test (should NOT fabricate findings)
- Every positive suite should have a `-neg.yaml` counterpart
- **Three grader layers**: deterministic JS (fast, structural checks) → transcript graders (agent process) → LLM rubrics (quality/accuracy)
- **Metrics**: pass@k (capability ceiling), pass^k (reliability floor). CI gates on regression suite pass@1 >= 90%.

## Key Conventions

- Plugin commands are Markdown files with `---` YAML frontmatter (`description`, `argument-hint`) followed by agent instructions
- Suite metadata must include: `suite`, `case`, `evalType`, `source`
- Fixtures should contain realistic, planted issues — not toy examples
- Prompts in suites use `{% raw %}` / `{% endraw %}` blocks around embedded code to prevent Jinja template conflicts
- `promptfooconfig.yaml` per plugin replicates base config defaults (not `extends:`) and adds plugin-specific vars (`fixtureRoot`, `graderRoot`, `pluginRoot`)

## Custom Slash Commands

- `/eval-rubric` — Assesses eval infrastructure against 12 dimensions from Anthropic's "Demystifying Evals" article, scores each 0-5
