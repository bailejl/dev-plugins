# Architecture & Design Pattern Review

You are performing an architectural review of this codebase. Analyze the project structure and code against the 6 weighted categories below. Focus on how the system is organized, how components interact, and whether design patterns are applied correctly and consistently.

---

## Target Languages & Frameworks

Detect the language and framework in use. Apply idiomatic architectural patterns for:
- **Java**: Spring, Jakarta EE
- **JavaScript/TypeScript**: Node.js, React, Angular, NestJS, Next.js
- **Python**: Django, FastAPI, Flask
- **C#/.NET**: ASP.NET Core, Entity Framework
- **Go**: Standard library, Gin, Echo
- **Rust**: Actix, Axum, Rocket

If the stack is different, apply general architectural principles.

---

## Evidence Gathering

Before scoring, use tools to understand the architecture:

```
# Understand project structure
find . -type d -not -path './.git/*' -not -path './node_modules/*' -not -path './venv/*' -maxdepth 4

# Identify architectural layers
glob **/controllers/**  OR  **/handlers/**  OR  **/routes/**
glob **/services/**  OR  **/usecases/**
glob **/models/**  OR  **/entities/**  OR  **/domain/**
glob **/repositories/**  OR  **/dal/**  OR  **/data/**

# Check for dependency injection patterns
grep -rn "inject\|@Injectable\|@Inject\|Container\|Provider" --include="*.ts" --include="*.java" --include="*.py"

# Check for circular dependencies (look for mutual imports)
# Read key files at module boundaries

# Check for god classes (large files with many responsibilities)
find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.java" -o -name "*.go" | xargs wc -l | sort -rn | head -20

# Check for barrel files / index re-exports
grep -rn "export \* from\|export {" --include="index.ts" --include="index.js"

# Identify cross-cutting concerns
grep -rn "logger\|Logger\|log\.\|console\." --include="*.ts" --include="*.js" --include="*.py" | head -20
```

---

## Pattern Categories

### 1. Layering & Separation of Concerns (Weight: 25%)

Evaluate:
- Is there a clear separation between presentation, business logic, and data access layers?
- Are there layering violations? (controllers accessing the database directly, UI logic in service classes)
- Is business logic kept out of controllers/handlers and data access layers?
- Are cross-cutting concerns (logging, auth, validation) handled consistently and not scattered?
- Does each file have a single, clear purpose?

### 2. Dependency Management (Weight: 20%)

Evaluate:
- Are circular dependencies present between modules, packages, or classes?
- Is dependency injection used consistently (not mixing DI with manual instantiation)?
- Do dependencies flow in one direction? (outer layers depend on inner, not vice versa)
- Are external dependencies isolated behind abstractions/interfaces?
- Is the dependency graph clean or tangled?

### 3. Design Pattern Correctness (Weight: 20%)

Evaluate:
- Are recognized design patterns (Factory, Repository, Observer, Strategy, Singleton, etc.) implemented correctly?
- Are patterns used consistently — if Repository is used in 10 places, is it used the same way?
- Are patterns appropriate for the problem they solve (no over-engineering)?
- Are anti-patterns present?
  - **God class/object**: class doing too much (> 500 lines, > 10 methods)
  - **Service locator** instead of dependency injection
  - **Anemic domain model**: data classes with no behavior, all logic in services
  - **Golden hammer**: forcing one pattern everywhere regardless of fit

### 4. Module & Component Boundaries (Weight: 15%)

Evaluate:
- Are modules/packages/namespaces organized by domain or feature (preferred) vs. by technical layer?
- Are module boundaries respected (no reaching into another module's internals)?
- Is there a clear public API for each module?
- Are shared utilities genuinely shared, or are they dumping grounds?
- Could the system be reasonably decomposed or scaled based on current boundaries?

### 5. SOLID Principles Adherence (Weight: 10%)

Evaluate:
- **Single Responsibility**: Does each class/module have one reason to change?
- **Open/Closed**: Can behavior be extended without modifying existing code?
- **Liskov Substitution**: Are subtypes genuinely substitutable for their base types?
- **Interface Segregation**: Are interfaces focused and minimal, not bloated?
- **Dependency Inversion**: Do high-level modules depend on abstractions, not concretions?

### 6. Scalability & Extensibility Patterns (Weight: 10%)

Evaluate:
- Are there hard-coded assumptions that would break at scale? (single-server assumptions, in-memory state)
- Is configuration externalized properly?
- Are extension points identifiable for likely future requirements?
- Is the system coupled to specific infrastructure (database, message broker) without abstraction?

---

## Scoring Instructions

For each category:

1. **List each violation** with a specific reference (file, class, module, or code snippet).
2. **Classify** each violation as:
   - **Critical** — architectural flaw requiring significant rework
   - **Major** — structural issue affecting maintainability or correctness
   - **Minor** — suboptimal but not harmful
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

```markdown
## Architecture Review Report

### Summary
- **Codebase/Module Reviewed**: [name or path]
- **Language/Framework Detected**: [language and framework]
- **Overall Score**: [X]/100
- **Result**: ✅ PASS / ❌ FAIL

### Architecture Overview
[Brief description of the detected architecture style — e.g., layered monolith, microservices, hexagonal, MVC — and whether it appears intentional and consistently applied.]

### Detailed Findings

#### [Category Name] — Score: [X]/100 (Weighted: [Y]/[max weight])

| # | Severity | Location | Finding | Recommendation |
|---|----------|----------|---------|----------------|
| 1 | Critical/Major/Minor | module/class | Description | Suggested fix |

(Repeat for each category)

### Score Breakdown

| Category | Weight | Raw Score | Weighted Score |
|----------|--------|-----------|----------------|
| Layering & Separation of Concerns | 25% | X/100 | X/25 |
| Dependency Management | 20% | X/100 | X/20 |
| Design Pattern Correctness | 20% | X/100 | X/20 |
| Module & Component Boundaries | 15% | X/100 | X/15 |
| SOLID Principles Adherence | 10% | X/100 | X/10 |
| Scalability & Extensibility Patterns | 10% | X/100 | X/10 |
| **Total** | **100%** | | **X/100** |

### Architectural Risks
1. [Highest risk to long-term maintainability]
2. [Second highest risk]
3. [Third highest risk]

### Top 3 Recommendations
1. [Most impactful structural improvement]
2. [Second most impactful]
3. [Third most impactful]
```

---

## Operating Principles

- **Read the structure first**: Understand the directory layout and module organization before reading individual files.
- **Follow the dependencies**: Trace how modules import from each other to detect circular dependencies and layering violations.
- **Check consistency**: A pattern used correctly in one place but incorrectly in another is a Major finding.
- **Focus on boundaries**: The most impactful architectural issues are at module boundaries, not inside functions.
