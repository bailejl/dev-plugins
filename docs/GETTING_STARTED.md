# Getting Started

Set up the dev-plugins repo for local development, install plugins, and run your first eval.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Python 3** >= 3.9 (for pass@k scripts)
- **Git** >= 2.30
- **Claude Code** CLI (active subscription)
- **Anthropic API key** (for running evals via promptfoo)
- **jq** (optional, for transcript viewer)

## Installation

```bash
# Clone the repo
git clone https://github.com/your-username/dev-plugins.git
cd dev-plugins

# Install dependencies
npm install
```

This installs the shared dev dependencies: promptfoo, eslint, prettier, axe-core, and vite.

## API Key Setup

Evals use [promptfoo](https://promptfoo.dev) to call the Anthropic API directly. You need an `ANTHROPIC_API_KEY` environment variable set before running evals.

```bash
# Option 1: Copy the template and fill in your key
cp .env.example .env
# Then edit .env with your real key

# Option 2: Export in your shell
export ANTHROPIC_API_KEY=your-key-here
```

You can get an API key from [console.anthropic.com](https://console.anthropic.com/).

The `.env` file is gitignored. You can place it at the repo root (used by `npm run eval:*` scripts) or in a specific eval directory (e.g., `evals/ai-readiness/.env`) for direct `npx promptfoo eval` runs — the eval script checks both locations.

> **Note:** The plugins themselves run inside Claude Code and use your Claude Code subscription — no API key needed. The API key is only required for the eval harness, which calls the Anthropic API through promptfoo to test plugin commands.

## Repo Layout

```
dev-plugins/
├── plugins/           # Plugin code — what ships to users
│   ├── frontend-dev/  # React scaffolding, a11y audits, refactoring
│   └── ai-readiness/  # Code quality, security, git health audits
├── evals/             # Per-plugin eval suites (stays in repo)
│   ├── frontend-dev/
│   └── ai-readiness/
├── eval-infra/        # Shared eval utilities, scripts, rubric templates
└── docs/              # You are here
```

**What ships vs. what stays:**

| Directory | Ships to users? | Purpose |
|-----------|:-:|---------|
| `plugins/` | Yes | Lean plugin code: commands, skills, agents, hooks |
| `evals/` | No | Eval suites, graders, fixtures, reference solutions |
| `eval-infra/` | No | Shared eval utilities and scripts |
| `docs/` | No | Contributor and learner guides |

## Installing Plugins in Claude Code

First, register the marketplace so Claude Code knows where to find plugins:

```bash
# Add the dev-plugins marketplace
/marketplace add https://github.com/bailejl/dev-plugins
```

Then install plugins from it:

```bash
# Install a specific plugin
/plugin install frontend-dev@dev-plugins

# Install the other plugin
/plugin install ai-readiness@dev-plugins
```

For local development, you can point to your local clone instead:

```bash
# Add the local marketplace
/marketplace add /path/to/dev-plugins
```

When installed, the user gets only the contents of `plugins/<name>/` — no fixtures, no graders, no eval code.

## Using Plugin Commands

After installation, plugin commands are available as slash commands:

```
# frontend-dev commands
/frontend-dev:scaffold-component
/frontend-dev:a11y-audit
/frontend-dev:responsive-check
/frontend-dev:refactor
/frontend-dev:design-system

# ai-readiness commands
/ai-readiness:full-audit
/ai-readiness:git-health
/ai-readiness:code-review
/ai-readiness:architecture
/ai-readiness:security
/ai-readiness:testing
/ai-readiness:api-review
```

## Running Evals

Evals verify that plugin commands produce correct, high-quality output.

### Quick start

```bash
# Run evals for one plugin
npm run eval:frontend
npm run eval:readiness

# Run all plugin evals
npm run eval:all
```

### Using the scripts directly

```bash
# Single plugin with verbose output
./eval-infra/scripts/run-plugin-evals.sh --verbose frontend-dev

# Dry run (show what would execute)
./eval-infra/scripts/run-plugin-evals.sh --dry-run ai-readiness

# All plugins, stop on first failure
./eval-infra/scripts/run-all-evals.sh --stop-on-failure
```

### Viewing results

After an eval run completes, you have three ways to inspect results — a web UI for interactive exploration, a JSON file for programmatic access, and a transcript viewer for debugging failures.

#### Promptfoo web UI

```bash
npx promptfoo view evals/frontend-dev/.promptfoo
```

This opens an interactive table in your browser. Rows are test cases and columns are assertions/metrics. Two top-level fields matter:

- **success** — overall pass/fail for the test case (all assertions must pass)
- **score** — weighted 0-1 aggregate across all assertions

Below the aggregate score, **named scores** break down individual metrics — for example, `report_structure`, `finding_quality`, or `evidence_cited`. These come in two flavors:

- **Deterministic scores** are 0 or 1 (pass/fail). A `contains` check either matches or it doesn't.
- **LLM-judged scores** are continuous 0-1. A rubric grading "finding quality" might score 0.7 if findings are mostly good but lack specificity.

Click any row to expand it and see the full agent output alongside assertion-level results with reasons explaining why each assertion passed or failed.

#### Understanding `output.json`

The raw results live in `output.json` inside the `.promptfoo` directory. The structure looks like this:

```json
{
  "results": {
    "results": [
      {
        "success": false,
        "score": 0.65,
        "testCase": {
          "description": "full-audit on repo with security issues",
          "metadata": { "suite": "security" }
        },
        "gradingResult": {
          "namedScores": {
            "report_structure": 1.0,
            "finding_quality": 0.7,
            "evidence_cited": 0.25
          },
          "componentResults": [
            {
              "pass": true,
              "assertion": { "type": "contains", "value": "## Findings" },
              "reason": "Output contains '## Findings'"
            },
            {
              "pass": false,
              "assertion": { "type": "llm-rubric" },
              "reason": "Agent identified SQL injection but missed the hardcoded credentials in config.py"
            }
          ]
        }
      }
    ]
  }
}
```

The key fields:

- `results.results[]` — array of individual test outcomes
- `success` / `score` — same as the web UI shows
- `gradingResult.namedScores` — per-metric score breakdown
- `gradingResult.componentResults` — per-assertion pass/fail with `reason` text. This is where you learn *why* something failed.

#### pass@k metrics

LLM outputs are stochastic — the same prompt can pass on one run and fail on the next. A single-run pass rate tells you little about whether a command actually works. Run each test multiple times and compute statistical metrics:

```bash
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/frontend-dev/.promptfoo/output.json \
  --k 1 3 5
```

The script computes two complementary metrics:

- **pass@k** (optimistic) — probability that *at least 1* of k samples passes. Formula: `1 - C(n-c, k) / C(n, k)`. This measures **capability**: "can the command do this at all?"
- **pass^k** (pessimistic) — probability that *all k* samples pass. Formula: `C(c, k) / C(n, k)`. This measures **reliability**: "will the command do this every time?"

**Example:** Suppose you run a test 10 times and 7 pass (n=10, c=7):

| Metric | Value | Interpretation |
|--------|------:|----------------|
| pass@1 | 70.0% | Any single run has a 70% chance of passing |
| pass@3 | 99.2% | Given 3 tries, you'll almost certainly see a pass |
| pass^3 | 29.2% | But all 3 passing? Only 29% of the time |

The command is **capable** (pass@3 is high) but **unreliable** (pass^3 is low). For production readiness, you need both.

**Target thresholds** (from [Eval Philosophy](EVAL_PHILOSOPHY.md)):

| Metric | Target | What it tells you |
|--------|-------:|-------------------|
| pass@1 | > 80%  | Single-run success rate |
| pass@5 | > 95%  | Capability ceiling |
| pass^5 | > 60%  | Reliability floor |

Use `--group-by suite` to see per-suite breakdowns:

```bash
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/ai-readiness/.promptfoo/output.json \
  --k 1 3 5 \
  --group-by suite
```

Sample output:

```
Results from: evals/ai-readiness/.promptfoo/output.json
Total test results: 30

------------------------------------------------------------------------
Group                    n     c    pass@1    pass@3    pass@5    pass^1    pass^3    pass^5
------------------------------------------------------------------------
security                10     8    80.0%    100.0%    100.0%    80.0%    46.7%    22.2%
structure               10     6    60.0%     96.7%    100.0%    60.0%    16.7%     2.4%
negative                10    10   100.0%    100.0%    100.0%   100.0%   100.0%   100.0%
------------------------------------------------------------------------
TOTAL                   30    24    80.0%     99.5%    100.0%    80.0%    49.9%    29.8%
------------------------------------------------------------------------
```

#### Transcript viewer

The transcript viewer shows the agent's full output for failed tests, which is where you do the real debugging:

```bash
# Show failed test transcripts (default)
./eval-infra/scripts/transcript-viewer.sh evals/frontend-dev/.promptfoo

# Show all transcripts, including passing tests
./eval-infra/scripts/transcript-viewer.sh --all evals/frontend-dev/.promptfoo

# Abbreviated output (first/last 3 turns)
./eval-infra/scripts/transcript-viewer.sh --short evals/frontend-dev/.promptfoo

# Filter to a specific test
./eval-infra/scripts/transcript-viewer.sh --test "scaffold" evals/frontend-dev/.promptfoo
```

Each test shows a summary with the description, PASS/FAIL status, score, and any assertion failure details with reasons. Below that is the full agent output.

**What to look for** when reading transcripts:

- **Did the agent miss a known issue?** (false negative) — The fixture has a planted bug, but the agent didn't report it. Check if it read the relevant files.
- **Did the agent fabricate a finding?** (false positive) — The agent reports an issue that doesn't exist. Common with clean/negative fixtures.
- **Did the agent cite specific files and lines?** (evidence quality) — Vague findings like "there may be security issues" are less useful than "SQL injection in `db.py:42`".
- **Was the reasoning sound even if the score was low?** — A thoughtful analysis that missed one finding is more promising than a lucky pass with sloppy reasoning.

#### Connecting results to iteration

Results feed directly back into the development loop:

1. **Read transcripts** to understand *why* tests fail, not just *that* they fail
2. **Diagnose the root cause** — is it the command prompt, the grader, or the fixture?
3. **Refine** — adjust the command prompt for false negatives, tighten grader rubrics for false positives, fix fixture documentation for grader mismatches
4. **Re-run** and compare metrics to confirm improvement

## Development Workflow

1. **Edit a plugin command** in `plugins/<name>/commands/`
2. **Run its eval suite** with `npm run eval:frontend` or `npm run eval:readiness`
3. **Review results** in the promptfoo UI or via transcript viewer
4. **Compute metrics** with the pass@k script
5. **Iterate** — adjust the command, add test cases, refine graders

## Next Steps

- [Adding a Plugin](ADDING_A_PLUGIN.md) — add a new plugin to the marketplace
- [Writing Evals](WRITING_EVALS.md) — create eval suites for your plugin
- [Eval Philosophy](EVAL_PHILOSOPHY.md) — principles behind eval-driven development
- [Grader Guide](GRADER_GUIDE.md) — deterministic, LLM, and transcript graders
