# Code Review & Static Analysis

You are performing a structured code review and static analysis of this codebase. Analyze the code against the 7 weighted categories below. For each category, identify violations, provide specific file/line references, classify severity, and assign a score.

---

## Target Languages

Detect the language(s) in use and adapt your analysis accordingly. Apply language-specific idioms and best practices for: Java, JavaScript/TypeScript, Python, C#/.NET, Go, Rust. If the language is not one of these, apply general best practices.

---

## Evidence Gathering

Before scoring, use tools to gather evidence:

```
# Identify language and file types
glob **/*.{ts,js,py,java,go,rs,cs}

# Sample files for manual inspection — pick 10-15 across different modules
# Read files to check naming, error handling, complexity

# Search for code smells
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" --include="*.py"
grep -rn "^[[:space:]]*//" --include="*.ts" --include="*.js"  # commented-out code

# Check for dead code indicators
grep -rn "unused\|deprecated" --include="*.ts" --include="*.js" --include="*.py"

# Look for generic/vague naming
grep -rn "data\|temp\|tmp\|result\|val\|item\|obj\|thing\|stuff" --include="*.ts" --include="*.js" --include="*.py"

# Check for deeply nested code (indentation depth)
# Read files and inspect for functions > 30 lines, nesting > 3 levels

# Check for any/unknown type usage (TypeScript)
grep -rn ": any\|as any" --include="*.ts"
```

---

## Pattern Categories

### 1. Naming Conventions (Weight: 10%)

Evaluate:
- Are variable, function, class, and file names consistent with the language's conventions?
- Is naming descriptive and intention-revealing?
- Are abbreviations avoided or used consistently?
- Are boolean variables/functions named with `is`/`has`/`can`/`should` prefixes where appropriate?
- Are file names consistent within each directory? (e.g., `UserService.ts` vs `user-service.ts` vs `userService.ts`)

### 2. Code Duplication (Weight: 15%)

Evaluate:
- Is there copy-pasted or near-duplicate logic that should be abstracted?
- Are there repeated patterns across files indicating a missing shared utility or base class?
- Are magic numbers or string literals repeated without constants?
- Are there multiple ways to do the same thing? (multiple HTTP clients, logging approaches, config-loading patterns)
- Are patterns inconsistent across layers? (callbacks in one module, async/await in another)

### 3. Error Handling (Weight: 20%)

Evaluate:
- Are exceptions/errors caught and handled meaningfully (no empty catch blocks)?
- Are promises/async operations properly awaited with error handling?
- Are null/undefined/None checks in place where needed?
- Are error messages descriptive and actionable?
- Are errors logged appropriately (not swallowed silently)?
- Are error boundaries established at appropriate layers?

### 4. Complexity & Readability (Weight: 20%)

Evaluate:
- Are functions/methods kept to a reasonable length (suggest < 30 lines)?
- Is cyclomatic complexity manageable (suggest < 10 per function)?
- Are deeply nested conditionals refactored (max 3 levels)?
- Are complex boolean expressions extracted into named variables or functions?
- Are comments used where logic is non-obvious (but not to explain bad code)?
- Are files kept under 500 lines?

### 5. Dead Code & Unused Imports (Weight: 10%)

Evaluate:
- Are there unused variables, functions, classes, or imports?
- Is there commented-out code that should be removed?
- Are there unreachable code paths?
- Are there TODO/FIXME/HACK comments older than 6 months?
- Are there files not imported or referenced anywhere?

### 6. Language-Specific Best Practices (Weight: 15%)

Evaluate based on detected language:
- **Java**: Proper use of Optional, streams vs loops, resource management (try-with-resources), immutability
- **JavaScript/TypeScript**: const/let over var, strict equality, proper TypeScript typing (no unnecessary `any`), async/await over raw promises
- **Python**: Pythonic idioms (list comprehensions, context managers, f-strings), type hints, proper dunder methods
- **C#/.NET**: Async/await patterns, LINQ usage, nullable reference types, IDisposable implementation
- **Go**: Error handling patterns, goroutine management, interface usage, package organization
- **Rust**: Ownership patterns, error handling with Result/Option, lifetime annotations
- **General**: Follow the principle of least surprise

### 7. Style & Convention Consistency (Weight: 10%)

Evaluate:
- Is formatting consistent throughout (indentation, spacing, line length)?
- Are similar operations done the same way across the codebase?
- Is there a consistent pattern for logging, configuration access, and dependency management?
- Are import ordering conventions followed?
- Is there a linter/formatter configured and enforced?

---

## Scoring Instructions

For each category:

1. **List each violation** found with a specific reference (file, line, or code snippet).
2. **Classify** each violation as:
   - **Critical** — fundamentally broken or dangerous
   - **Major** — significant quality issue
   - **Minor** — style or preference issue
3. **Score** the category from 0–100:
   - 100: No violations found
   - 80–99: Minor violations only
   - 60–79: One or more major violations
   - 0–59: Critical violations present
4. **Multiply** by the category weight to get the weighted score.

### Final Score

Sum all weighted scores for a total out of 100.

- **Pass**: Score ≥ 75
- **Fail**: Score < 75

---

## Output Format

Produce the report in this structure:

```markdown
## Code Review Report

### Summary
- **File(s) Reviewed**: [list files or "full codebase"]
- **Language Detected**: [language]
- **Overall Score**: [X]/100
- **Result**: ✅ PASS / ❌ FAIL

### Detailed Findings

#### [Category Name] — Score: [X]/100 (Weighted: [Y]/[max weight])

| # | Severity | Location | Finding | Recommendation |
|---|----------|----------|---------|----------------|
| 1 | Critical/Major/Minor | file:line | Description | Suggested fix |

(Repeat for each category)

### Score Breakdown

| Category | Weight | Raw Score | Weighted Score |
|----------|--------|-----------|----------------|
| Naming Conventions | 10% | X/100 | X/10 |
| Code Duplication | 15% | X/100 | X/15 |
| Error Handling | 20% | X/100 | X/20 |
| Complexity & Readability | 20% | X/100 | X/20 |
| Dead Code & Unused Imports | 10% | X/100 | X/10 |
| Language-Specific Best Practices | 15% | X/100 | X/15 |
| Style & Convention Consistency | 10% | X/100 | X/10 |
| **Total** | **100%** | | **X/100** |

### Top 3 Recommendations
1. [Most impactful improvement]
2. [Second most impactful]
3. [Third most impactful]
```

---

## Operating Principles

- **Show evidence**: Every finding must cite specific files, line numbers, or patterns. No hand-waving.
- **Be proportional**: Don't spend 500 words on a minor naming issue. Focus depth on Critical and Major findings.
- **Sample strategically**: For large codebases, sample 10–15 files across different modules and layers. Prioritize high-traffic files (most recently/frequently modified).
- **Detect the language first**: Adjust all criteria to the detected language's conventions and ecosystem.
