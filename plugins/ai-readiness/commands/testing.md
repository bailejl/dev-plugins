---
description: Assess test quality combining 6-category weighted evaluation with test pyramid analysis and desiderata macro goals.
---

# Test Quality Assessment

You are performing a comprehensive test quality assessment combining two frameworks:
1. **Testing Pattern Validation** — 6-category weighted evaluation of test quality, coverage, and correctness
2. **Test Desiderata & Pyramid Assessment** — evaluating test distribution, desiderata macro goals, and legacy system detection

---

## Target Languages & Frameworks

Detect the language and test framework. Apply best practices for:
- **Java**: JUnit 5, Mockito, AssertJ, Spring Boot Test
- **JavaScript/TypeScript**: Jest, Vitest, Mocha, Cypress, Playwright, Testing Library
- **Python**: pytest, unittest, mock, hypothesis
- **C#/.NET**: xUnit, NUnit, MSTest, Moq, FluentAssertions
- **Go**: testing package, testify, gomock
- **Rust**: built-in test framework, mockall

If the framework is different, apply general testing principles.

---

## Phase 1: Automated Discovery

Before evaluating, scan the codebase to gather testing infrastructure information:

```
# Find test configuration files
glob **/jest.config.* **/vitest.config.* **/playwright.config.* **/cypress.config.*
glob **/pytest.ini **/setup.cfg **/tox.ini **/conftest.py
glob **/.mocharc.* **/karma.conf.*

# Find test files
glob **/*.test.* **/*.spec.* **/*_test.* **/*_spec.*
glob **/__tests__/** **/test/** **/tests/** **/spec/**

# Count test vs source files
find . -type f -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" | wc -l
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.java" -o -name "*.go" \) -not -name "*.test.*" -not -name "*.spec.*" -not -name "*_test.*" -not -path "*/node_modules/*" -not -path "*/vendor/*" | wc -l

# Find CI configuration
glob .github/workflows/*.yml .gitlab-ci.yml Jenkinsfile .circleci/config.yml

# Check for coverage configuration
glob **/codecov.yml **/.coveragerc **/coverage/** **/.nycrc*
grep -rn "coverage" --include="jest.config.*" --include="vitest.config.*" --include="package.json"

# Find test utilities, fixtures, factories
glob **/fixtures/** **/factories/** **/helpers/** **/test-utils/**
grep -rn "factory\|fixture\|builder\|mock\|stub\|fake" --include="*.test.*" --include="*.spec.*" | head -20

# Static analysis tools present
glob **/.eslintrc.* **/.prettierrc.* **/tsconfig.json **/sonar-project.properties

# Legacy indicators
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" --include="*.py" | wc -l
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) -not -path "*/node_modules/*" | xargs wc -l 2>/dev/null | sort -rn | head -5
```

---

## Phase 2: Legacy System Detection

**Check for legacy triggers. If ANY are true, activate the legacy assessment section.**

| Trigger | Threshold | How to Detect |
|---------|-----------|---------------|
| Low Code Coverage | < 30% line coverage | Coverage reports, codecov config |
| No Tests | 0 test files found | File system scan |
| Ice Cream Cone | E2E tests > Unit tests | Test file analysis |
| Ancient Codebase | > 3 years without testing culture | `git log --reverse --format='%ad' --date=short | head -1` |
| High Complexity | Cyclomatic complexity > 15 avg | Static analysis / manual sampling |
| Tight Coupling | No dependency injection, globals | Code inspection |
| No CI/CD | No pipeline configuration | File system scan |

> "Legacy code is code without tests." — Michael Feathers, *Working Effectively with Legacy Code*

---

## Phase 3: Testing Pattern Evaluation (6 Categories)

### 1. Test Coverage & Completeness (Weight: 25%)

Evaluate:
- Are all public methods/functions covered by at least one test?
- Are critical business logic paths tested?
- Are edge cases covered? (boundary values, null/empty inputs, error paths)
- Are both happy path and failure path scenarios tested?
- Are integration points (API calls, database operations, file I/O) tested?
- Is there a noticeable pattern of only testing the easy cases?

### 2. Test Quality & Assertions (Weight: 25%)

Evaluate:
- Does each test have meaningful assertions (not just "doesn't throw")?
- Are assertions specific (checking exact values, not just truthiness)?
- Are tests testing behavior rather than implementation details?
- Are there tautological tests (tests that can never fail, or that test mocks instead of real logic)?
- Is each test independent and able to run in isolation?
- Does each test verify one logical concept?
- Are assertion messages descriptive enough to diagnose failures?

### 3. Test Naming & Organization (Weight: 10%)

Evaluate:
- Do test names describe the scenario and expected outcome?
  - Good: `should_return_404_when_user_not_found`
  - Bad: `testMethod1`, `test_it_works`
- Are tests organized logically (by feature, by class, by behavior)?
- Are test files co-located with source or in a mirrored structure?
- Are test suites/describe blocks used to group related tests?
- Is the Arrange-Act-Assert (or Given-When-Then) pattern followed?

### 4. Test Reliability & Flakiness (Weight: 20%)

Evaluate:
- Are there time-dependent tests (using real dates, timeouts, or sleep)?
- Are there order-dependent tests (test B relies on state from test A)?
- Are there tests with race conditions (async operations without proper waiting)?
- Is test data isolated (no shared mutable state between tests)?
- Are external dependencies properly mocked or stubbed?
- Are there hardcoded ports, paths, or environment-specific values?
- Is test setup/teardown properly cleaning up state?

### 5. Mock & Stub Usage (Weight: 10%)

Evaluate:
- Are mocks used appropriately (mocking external dependencies, not internal logic)?
- Are mocks verifying meaningful interactions, not just being called?
- Is there over-mocking (mocking so much that the test doesn't test anything real)?
- Are mock setups reusable (shared fixtures, factories) vs duplicated everywhere?
- Are mocks kept up to date with the real interfaces they replace?
- Are integration tests used where mocks would hide real problems?

### 6. Test Maintainability (Weight: 10%)

Evaluate:
- Is test data created via builders or factories (not massive inline object literals)?
- Are test utilities and helpers DRY without sacrificing readability?
- Are tests resilient to refactoring (testing contracts, not structure)?
- Is there excessive setup code that makes tests hard to understand?
- Are tests readable enough to serve as documentation of expected behavior?
- Is there a clear testing strategy (unit → integration → e2e pyramid)?

---

## Phase 4: Testing Pyramid Assessment

Evaluate the shape of the test distribution:

```
Healthy Pyramid:
        /\          ← Few E2E tests (5-10%)
       /  \
      /    \        ← Some Integration tests (15-25%)
     /      \
    /        \      ← Many Unit tests (60-80%)
   /__________\
```

**Anti-patterns to identify:**

| Shape | Name | Symptoms | Root Cause |
|-------|------|----------|------------|
| Inverted ▼ | Ice Cream Cone | Slow CI, flaky tests, fear of refactoring | Legacy system, no testing culture |
| Hourglass ⧗ | Hourglass | Unit & E2E but nothing between | Skipped integration layer |
| Rectangle ▬ | Rectangle | Equal all layers | No strategy, "just add tests" |
| Empty ∅ | No Tests | No automation | Legacy, time pressure, skill gap |

Estimate the current ratio: Unit : Integration : E2E

---

## Phase 5: Test Desiderata 2.0 Assessment

Rate against four macro goals (1–5 each):

### Macro Goal 1: Predict Success in Production
- Do tests catch real bugs before production?
- Are tests sensitive to behavioral changes?
- Do they test execution qualities (performance, load)?

### Macro Goal 2: Fast Feedback
- How long until developers know if they broke something?
- Can tests run in any order? In parallel?
- Do tests require minimal setup/data?

### Macro Goal 3: Low Total Cost of Ownership
- Are tests automated and deterministic?
- Do tests have clear, diagnosable failures?
- Are tests easy to read, write, and update?
- Do tests survive refactoring (structure insensitive)?

### Macro Goal 4: Support Code Design Changes
- Do tests document intent?
- Do tests guide development choices (TDD)?
- Do tests provide positive design pressure?
- Are tests composable and organized?

---

## Phase 6: Legacy Assessment (Conditional)

**Only include this section if legacy triggers were detected in Phase 2.**

### Legacy Classification

- [ ] **Not Legacy** — Healthy test coverage, good practices
- [ ] **Mild Legacy** — Some coverage gaps, recoverable with standard practices
- [ ] **Moderate Legacy** — Significant gaps, needs characterization testing
- [ ] **Severe Legacy** — Minimal/no tests, requires comprehensive recovery strategy
- [ ] **Critical Legacy** — No tests, no documentation, original team gone

### Recommended Recovery Strategy

For **Moderate to Critical Legacy** systems, recommend:

1. **Immediate**: Write characterization tests (approval tests) for high-risk areas to capture current behavior as a baseline.
2. **Short-term**: Identify seams for dependency breaking (extract interface, parameterize constructor). Begin coverage-guided test generation.
3. **Medium-term**: Convert characterization tests to proper unit tests where behavior is understood. Adopt strangler fig pattern for new features.
4. **Long-term**: Achieve healthy test pyramid. TDD as default practice.

Reference tools:
- **Characterization testing**: ApprovalTests, Jest Snapshots, Verify (.NET)
- **Traffic replay**: GoReplay, WireMock, VCR
- **Test generation**: EvoSuite (Java), Pynguin (Python), Diffblue Cover
- **Safe refactoring**: IDE automated refactorings, jscodeshift (JS/TS)

---

## Scoring Instructions

For each of the 6 testing pattern categories:

1. **List each finding** with a specific reference (test file, test name, or code snippet).
2. **Classify** each finding as:
   - **Critical** — test provides false confidence (passes when it shouldn't, or tests nothing)
   - **Major** — significant gap in coverage or quality
   - **Minor** — style, naming, or organization issue
3. **Score** from 0–100 per the standard methodology.
4. **Multiply** by weight.

### Final Score

- **Pass**: Score ≥ 75
- **Fail**: Score < 75

---

## Output Format

```markdown
## Test Quality Assessment Report

### Summary
- **Test File(s) Reviewed**: [list or count]
- **Source File(s) Covered**: [list corresponding source files]
- **Language/Framework**: [language and test framework]
- **Overall Score**: [X]/100
- **Result**: ✅ PASS / ❌ FAIL
- **Legacy Status**: [Not Legacy / Mild / Moderate / Severe / Critical]

### Coverage Overview
- **Estimated Method/Function Coverage**: [X]% of public methods have at least one test
- **Edge Case Coverage**: [Low / Medium / High]
- **Error Path Coverage**: [Low / Medium / High]

### Testing Pyramid Shape
- **Current Shape**: [Pyramid / Ice Cream Cone / Hourglass / Rectangle / Empty]
- **Unit Tests**: ~[X]% ([count])
- **Integration Tests**: ~[X]% ([count])
- **E2E Tests**: ~[X]% ([count])
- **Assessment**: [Healthy / Needs Rebalancing / Critical]

### Desiderata 2.0 Scorecard

| Macro Goal | Score (1-5) | Key Finding |
|------------|:-----------:|-------------|
| Predict Production Success | [X] | [finding] |
| Fast Feedback | [X] | [finding] |
| Low Total Cost of Ownership | [X] | [finding] |
| Support Design Changes | [X] | [finding] |

### Detailed Findings

#### [Category Name] — Score: [X]/100 (Weighted: [Y]/[max weight])

| # | Severity | Location | Finding | Recommendation |
|---|----------|----------|---------|----------------|
| 1 | Critical/Major/Minor | test_file:test_name | Description | Suggested fix |

(Repeat for each of the 6 categories)

### Score Breakdown

| Category | Weight | Raw Score | Weighted Score |
|----------|--------|-----------|----------------|
| Test Coverage & Completeness | 25% | X/100 | X/25 |
| Test Quality & Assertions | 25% | X/100 | X/25 |
| Test Naming & Organization | 10% | X/100 | X/10 |
| Test Reliability & Flakiness | 20% | X/100 | X/20 |
| Mock & Stub Usage | 10% | X/100 | X/10 |
| Test Maintainability | 10% | X/100 | X/10 |
| **Total** | **100%** | | **X/100** |

### Missing Test Recommendations

| # | Source Location | Scenario to Test | Priority |
|---|---------------|------------------|----------|
| 1 | file:method | Description of missing test case | High/Medium/Low |

### Legacy Recovery Plan (if applicable)
[Include phased recovery plan if legacy triggers detected]

### Top 3 Recommendations
1. [Most impactful testing improvement]
2. [Second most impactful]
3. [Third most impactful]
```

---

## Operating Principles

- **Provide both test AND source files**: Always read both the test and the code it tests to evaluate coverage and correctness.
- **Tests are documentation**: Well-written tests are the AI's best teacher. Evaluate whether tests could serve as a specification.
- **Sample strategically**: For large test suites, sample tests from each module/feature. Prioritize recently changed tests and high-traffic modules.
- **Detect the pyramid shape early**: The shape tells you immediately whether there's a strategic testing problem.
- **Lead with empathy for legacy**: Legacy code is common, not shameful. Focus on incremental improvement.

### References
- Emily Bache, "Test Desiderata 2.0" (2025)
- Ham Vocke, "The Practical Test Pyramid" (2018) — martinfowler.com
- Michael Feathers, *Working Effectively with Legacy Code* (2004)
- Kent Beck, "Test Desiderata" (2019) — testdesiderata.com
