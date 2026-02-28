# dev-plugins

A Claude Code plugin marketplace for development tooling — with built-in evaluation harnesses for each plugin.

Designed as a **reference implementation** demonstrating how to build scalable plugin marketplaces with rigorous, eval-driven development practices.

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

# Set your Anthropic API key (required for running evals)
```bash
# Option 1: Export in your shell
export ANTHROPIC_API_KEY=your-key-here

# Option 2: Add to a .env file (gitignored)
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

### Run evals for a specific plugin

npm run eval:frontend
npm run eval:readiness

### Run all evals

npm run eval:all

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for detailed setup instructions.

## Tooling

| Tool | Purpose |
|------|---------|
| [Promptfoo](https://promptfoo.dev) | Eval harness + LLM grading |
| ESLint | Code-based grading (lint) |
| Prettier | Code-based grading (format) |
| axe-core | Accessibility assertion engine |
| Vite | Test fixture builds (frontend-dev) |

## License

MIT
