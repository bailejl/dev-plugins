# Adding a Plugin

How to add a new plugin to the dev-plugins marketplace.

## Overview

Each plugin lives in `plugins/<plugin-name>/` and has a parallel eval suite in `evals/<plugin-name>/`. This guide walks through creating both.

## Step 1: Create the Plugin Directory

```bash
mkdir -p plugins/my-plugin/.claude-plugin
mkdir -p plugins/my-plugin/commands
mkdir -p plugins/my-plugin/agents
mkdir -p plugins/my-plugin/skills
mkdir -p plugins/my-plugin/hooks
```

## Step 2: Create the Plugin Manifest

Create `plugins/my-plugin/.claude-plugin/plugin.json`:

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "Short description of what the plugin does",
  "author": { "name": "your-username" },
  "license": "MIT",
  "commands": [
    {
      "name": "my-command",
      "description": "What this command does",
      "source": "./commands/my-command.md"
    }
  ],
  "agents": [
    {
      "name": "my-agent",
      "description": "What this agent does",
      "source": "./agents/my-agent.md"
    }
  ],
  "skills": [
    {
      "name": "my-skill",
      "description": "Domain knowledge this skill provides",
      "source": "./skills/my-skill.md"
    }
  ]
}
```

### Plugin manifest fields

| Field | Required | Description |
|-------|:--------:|-------------|
| `name` | Yes | Plugin identifier (lowercase, hyphens) |
| `version` | Yes | Semver version string |
| `description` | Yes | One-line description |
| `author` | Yes | `{ "name": "..." }` |
| `license` | Yes | License identifier (e.g., "MIT") |
| `commands` | No | Array of slash commands |
| `agents` | No | Array of agent definitions |
| `skills` | No | Array of skill/knowledge files |

## Step 3: Write Commands

Commands are markdown files that serve as prompts. Create `plugins/my-plugin/commands/my-command.md`:

```markdown
# my-command

You are an expert at [domain]. The user wants you to [task].

## Instructions

1. First, read the relevant files using the Read tool
2. Analyze the code for [specific things]
3. Produce a report with the following sections:
   - Summary
   - Findings
   - Recommendations

## Output Format

[Specify the exact output format you expect]

## Constraints

- Do not modify any files unless asked
- Stay within the scope of [domain]
```

### Command writing tips

- Be specific about what tools the agent should use
- Specify the output format explicitly
- Include constraints to prevent scope creep
- Reference the skills the agent should draw on

## Step 4: Write Skills

Skills provide domain knowledge that commands and agents can reference. Create `plugins/my-plugin/skills/my-skill.md`:

```markdown
# My Skill

## Key Concepts

[Domain knowledge the agent needs]

## Patterns

[Common patterns to recognize and apply]

## Anti-patterns

[Things to avoid]
```

## Step 5: Write Agents

Agents combine multiple commands with decision-making logic. Create `plugins/my-plugin/agents/my-agent.md`:

```markdown
# My Agent

You are [role description]. You combine the capabilities of:
- /my-plugin:command-a
- /my-plugin:command-b

## Decision Tree

1. Start by [initial investigation]
2. Based on findings, decide which commands to run
3. Synthesize results into a unified report
```

## Step 6: Add Hooks (Optional)

Create `plugins/my-plugin/hooks/hooks.json` for lifecycle hooks:

```json
{
  "hooks": []
}
```

## Step 7: Register in the Marketplace

Add your plugin to `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "Short description",
  "version": "0.1.0",
  "author": { "name": "your-username" },
  "license": "MIT",
  "keywords": ["relevant", "keywords"],
  "category": "code-intelligence"
}
```

## Step 8: Create the Eval Suite

Create the parallel eval structure:

```bash
mkdir -p evals/my-plugin/suites
mkdir -p evals/my-plugin/graders/deterministic
mkdir -p evals/my-plugin/graders/llm-rubrics
mkdir -p evals/my-plugin/graders/transcript
mkdir -p evals/my-plugin/fixtures
mkdir -p evals/my-plugin/reference-solutions
```

Create `evals/my-plugin/promptfooconfig.yaml`:

```yaml
extends: ../../eval-infra/promptfoo-base.yaml

metadata:
  plugin: ../../plugins/my-plugin

tests:
  - file://suites/my-command.yaml

defaultTest:
  assert:
    - type: javascript
      value: file://../../eval-infra/grader-lib/transcript-utils.js
```

See [Writing Evals](WRITING_EVALS.md) for details on creating test suites, fixtures, and graders.

## Step 9: Update run-plugin-evals.sh

Add your plugin name to the `KNOWN_PLUGINS` array in `eval-infra/scripts/run-plugin-evals.sh`:

```bash
KNOWN_PLUGINS=("frontend-dev" "ai-readiness" "my-plugin")
```

## Checklist

- [ ] Plugin directory: `plugins/my-plugin/`
- [ ] Plugin manifest: `plugins/my-plugin/.claude-plugin/plugin.json`
- [ ] At least one command: `plugins/my-plugin/commands/*.md`
- [ ] Marketplace entry: `.claude-plugin/marketplace.json`
- [ ] Eval directory: `evals/my-plugin/`
- [ ] Eval config: `evals/my-plugin/promptfooconfig.yaml`
- [ ] At least one test suite: `evals/my-plugin/suites/*.yaml`
- [ ] At least one fixture: `evals/my-plugin/fixtures/`
- [ ] Updated `KNOWN_PLUGINS` in `run-plugin-evals.sh`

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Plugin name | lowercase, hyphens | `my-plugin` |
| Command name | lowercase, hyphens | `my-command` |
| Command file | `<command-name>.md` | `my-command.md` |
| Suite file | `<command-name>.yaml` | `my-command.yaml` |
| Negative suite | `<command-name>-neg.yaml` | `my-command-neg.yaml` |
| Fixture dir | descriptive kebab-case | `broken-auth-repo` |
