# dev-plugins

A Claude Code plugin marketplace for development tooling — with built-in evaluation harnesses for each plugin.

Designed as a **reference implementation** demonstrating how to build Claude Code plugins with rigorous, [eval-driven development](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

<!-- CI badge placeholder -->
<!-- ![Eval CI](https://github.com/<owner>/dev-plugins/actions/workflows/eval-ci.yaml/badge.svg) -->

## Quick Demo

```bash
# 1. Install dependencies
npm install

# 2. Set your API key (used by eval harness)
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# 3. Run evals for one plugin and view results
npm run eval:readiness
npx promptfoo view
```

## How Evals Work

```text
┌──────────┐    ┌───────────┐    ┌──────────────────┐    ┌─────────┐
│   Task   │───▶│  Trial    │───▶│     Graders      │───▶│ Outcome │
│ (test    │    │  (single  │    │ • deterministic  │    │ pass@k  │
│  case in │    │  prompt-  │    │ • llm-rubric     │    │ pass^k  │
│  suite)  │    │  foo run) │    │ • transcript     │    │ scores  │
└──────────┘    └───────────┘    └──────────────────┘    └─────────┘
```

See [BASELINE.md](BASELINE.md) for current eval metrics and [docs/EVAL_TAXONOMY.md](docs/EVAL_TAXONOMY.md) for how our eval concepts map to the [Anthropic "Demystifying Evals" article](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

## Plugins

### frontend-dev

React component scaffolding, accessibility audits, responsive design checks, component refactoring, and design system compliance.

**Commands:**

- `/frontend-dev:scaffold-component` — Scaffold a React component with props, types, tests, and story
- `/frontend-dev:a11y-audit` — WCAG 2.1 AA compliance audit using axe-core patterns
- `/frontend-dev:responsive-check` — Responsive design audit (media queries, viewport, touch targets)
- `/frontend-dev:refactor` — React component refactoring (decompose, extract hooks, reduce complexity)
- `/frontend-dev:design-system` — Design system compliance (tokens vs hardcoded values)

### ai-readiness

Assess a repository and its git history for AI-coding assistant readiness — comprehensive audits covering code quality, security, testing, architecture, git health, and API design.

**Commands:**

- `/ai-readiness:full-audit` — 10-section comprehensive AI readiness audit
- `/ai-readiness:git-health` — 71 git anti-patterns with DORA-based severity scoring
- `/ai-readiness:code-review` — 7-category weighted code review and static analysis
- `/ai-readiness:architecture` — 6-category architecture review with SOLID principles
- `/ai-readiness:security` — 6-category security review (OWASP, auto-fail on critical)
- `/ai-readiness:testing` — Test quality: patterns, desiderata, pyramid analysis
- `/ai-readiness:api-review` — 7-category API design and contract review

## Project Structure

```text
dev-plugins/
├── plugins/           # What ships to users (commands, skills, agents, hooks)
│   ├── frontend-dev/
│   └── ai-readiness/
├── evals/             # Per-plugin eval suites, graders, fixtures (stays in repo)
│   ├── frontend-dev/
│   └── ai-readiness/
├── eval-infra/        # Shared eval utilities, scripts, rubric templates
└── docs/              # Contributor and learner guides
```

## Getting Started

```bash
# Install dependencies
npm install

# Set your Anthropic API key in .env (gitignored)
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

### Run evals

```bash
# Single plugin
npm run eval:frontend
npm run eval:readiness

# All plugins
npm run eval:all
```

### View results

```bash
# Interactive web viewer
npx promptfoo view

# Compute pass@k metrics
python eval-infra/scripts/compute-pass-at-k.py --results evals/ai-readiness/.promptfoo/output.json --k 1 3 5
```

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for detailed setup instructions.

## Tooling

| Tool | Purpose |
|------|---------|
| [Promptfoo](https://promptfoo.dev) | Eval harness + LLM grading |
| ESLint | Code-based grading (lint) |
| Prettier | Code-based grading (format) |
| axe-core | Accessibility assertion engine |
| Vite | Test fixture builds (frontend-dev) |

## Documentation

- [Getting Started](docs/GETTING_STARTED.md) — Setup and first eval run
- [Eval Philosophy](docs/EVAL_PHILOSOPHY.md) — Principles of eval-driven development
- [Eval Taxonomy](docs/EVAL_TAXONOMY.md) — Maps Anthropic article concepts to this repo
- [Writing Evals](docs/WRITING_EVALS.md) — How to write test suites
- [Grader Guide](docs/GRADER_GUIDE.md) — Grader types and implementation patterns
- [Adding a Plugin](docs/ADDING_A_PLUGIN.md) — Step-by-step guide for new plugins

## License

MIT
