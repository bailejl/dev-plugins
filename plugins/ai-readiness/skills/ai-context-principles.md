# AI Context Principles

This skill provides knowledge about AI context windows, token budgets, and signal-to-noise ratio — the foundational concepts behind AI readiness audits.

---

## Context Window Fundamentals

AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) operate within a **context window** — a fixed-size buffer of tokens that holds everything the AI can "see" at once.

### Current Context Window Sizes

| Model Family | Context Window | Approximate Lines of Code |
|-------------|---------------|--------------------------|
| Claude 3.5+ | 200K tokens | ~150,000 lines |
| GPT-4 Turbo | 128K tokens | ~96,000 lines |
| Gemini 1.5 | 1M–2M tokens | ~750K–1.5M lines |

Despite large windows, **effective context** is much smaller. Research shows performance degrades well before the window is full.

---

## Signal-to-Noise Ratio

The most critical concept in AI readiness: the ratio of **useful, accurate information** to **irrelevant, misleading, or outdated content** in the AI's context.

### Research Findings

| Finding | Source | Implication |
|---------|--------|-------------|
| Adding just **10% irrelevant content** reduces AI accuracy by **23%** | Prompt engineering research | Even small amounts of noise significantly degrade output |
| Even with perfect retrieval, performance drops **13.9–85%** as input length grows | "Lost in the Middle" research | More context ≠ better results |
| LLMs can track at most **5–10 variables** before performance degrades to random guessing | Cognitive load studies | Complex, intertwined code overwhelms AI reasoning |
| AI models treat existing codebase patterns as **implicit instructions** | Pattern replication studies | Messy code breeds more messy code |
| Codebases are a proven **prompt injection attack surface** with success rates of **41–84%** | Security research | Code content can manipulate AI behavior |

### What Counts as Noise

| Noise Source | Token Cost | Impact |
|-------------|-----------|--------|
| Commented-out code | High — every line consumed | AI may treat as valid alternatives |
| Stale TODO/FIXME comments | Medium | Creates false urgency, distracts from real work |
| Outdated documentation | High — treated as authoritative rules | AI follows wrong instructions confidently |
| Generated files (bundles, lockfiles) | Very high — thousands of tokens | Consumes budget with zero learning signal |
| Duplicate code | High — repeated patterns amplified | AI replicates duplication patterns |
| Dead code / unused files | Medium-High | Confuses dependency understanding |
| Vendor/node_modules | Extreme | Can dominate entire context |

### What Counts as Signal

| Signal Source | Value | Why |
|-------------|-------|-----|
| Type annotations | Very high | Contracts the AI can reason about |
| Well-named functions/variables | High | Intention-revealing code guides AI output |
| Well-written tests | Very high | Executable documentation of expected behavior |
| CLAUDE.md / AI instruction files | High | Direct guidance for AI behavior |
| Consistent patterns | High | Clear templates for AI to follow |
| Accurate inline docs (why, not what) | Medium-High | Explains intent and constraints |

---

## Token Cost of Common File Types

| File Type | Avg Tokens/Line | Typical File Size | Token Cost |
|-----------|----------------|-------------------|------------|
| TypeScript/JavaScript | ~4–6 | 200 lines | 800–1,200 |
| Python | ~3–5 | 150 lines | 450–750 |
| JSON config | ~2–3 | 50 lines | 100–150 |
| Markdown docs | ~4–6 | 100 lines | 400–600 |
| package-lock.json | ~3–4 | 10,000+ lines | 30,000–40,000 |
| Minified JS bundle | ~8–12 | 5,000+ lines | 40,000–60,000 |

---

## Strategies for Maximizing Signal

### 1. Exclude Noise at the Source
- Use `.claudeignore` / `.cursorignore` to exclude generated files, vendor dirs, lock files, build output.
- Delete commented-out code — git has the history.
- Remove dead code, unused files, stale documentation.

### 2. Improve Signal Quality
- Add type annotations to public APIs and module boundaries.
- Write intention-revealing names (the AI replicates what it sees).
- Keep documentation accurate and current — the AI treats it as ground truth.
- Write tests that serve as executable specifications.

### 3. Structure for Efficient Retrieval
- Co-locate related files (feature-based organization > type-based).
- Keep files under 500 lines — the AI reasons better about focused files.
- Use clear, consistent naming patterns so the AI can predict file locations.

### 4. Direct the AI Explicitly
- Create a CLAUDE.md with project conventions, build commands, and critical rules.
- Keep CLAUDE.md under 300 lines — longer files get deprioritized as context grows.
- Enforce critical rules via hooks (deterministic) rather than instructions (advisory).

### 5. Reduce Cognitive Complexity
- Consolidate duplicate patterns into canonical implementations.
- Maintain one way to do each common operation.
- Keep cyclomatic complexity low — the AI's reasoning degrades with deep nesting.

---

## The AI Readiness Equation

```
AI Output Quality ≈ f(Signal Quality × Signal Volume / Total Context Size)
```

Improving AI readiness means:
- **Increase signal**: Better types, names, tests, documentation
- **Decrease noise**: Remove dead code, stale docs, generated files
- **Reduce total context**: Exclude irrelevant content via ignore files
- **Direct explicitly**: CLAUDE.md, hooks, consistent patterns
