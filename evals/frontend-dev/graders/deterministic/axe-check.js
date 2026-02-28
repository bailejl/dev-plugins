/**
 * evals/frontend-dev/graders/deterministic/axe-check.js
 *
 * Deterministic grader that checks agent output for correct identification
 * of axe-core accessibility violations. Verifies that the agent's a11y audit
 * report references the expected violation categories.
 *
 * Used by a11y.yaml and a11y-neg.yaml test suites.
 *
 * @param {string} output - The agent's audit report output
 * @param {Object} context - Promptfoo context with vars
 * @param {string[]} context.vars.expectedViolations - Violation categories to find
 * @param {string[]} [context.vars.unexpectedViolations] - Categories that should NOT appear
 * @returns {{ pass: boolean, score: number, reason: string }}
 */

// axe-core rule categories and their common aliases
const AXE_RULE_MAP = {
  "image-alt": [
    "image-alt",
    "alt text",
    "alt attribute",
    "missing alt",
    "img.*alt",
    "non-text content",
    "1\\.1\\.1",
  ],
  "button-name": [
    "button-name",
    "button.*accessible name",
    "button.*label",
    "button.*text",
    "4\\.1\\.2",
  ],
  label: [
    "\\blabel\\b",
    "input.*label",
    "form.*label",
    "missing label",
    "htmlfor",
    "for attribute",
    "1\\.3\\.1",
    "4\\.1\\.2",
  ],
  "color-contrast": [
    "color.contrast",
    "contrast ratio",
    "4\\.5:1",
    "3:1",
    "1\\.4\\.3",
    "1\\.4\\.11",
    "wcag.*contrast",
  ],
  keyboard: [
    "keyboard",
    "tabindex",
    "onkeydown",
    "onkeyup",
    "key handler",
    "keyboard.*accessible",
    "2\\.1\\.1",
  ],
  "aria-required-attr": [
    "aria-required",
    "required aria",
    "missing aria",
    "aria.*attribute.*required",
    "4\\.1\\.2",
  ],
  "aria-valid-attr-value": [
    "aria.*valid",
    "invalid aria",
    "aria.*value",
    "4\\.1\\.2",
  ],
  "focus-order-semantics": [
    "focus.order",
    "tab order",
    "focus.*management",
    "2\\.4\\.3",
  ],
  region: [
    "landmark",
    "region",
    "<main>",
    "<nav>",
    "<header>",
    "landmark region",
    "1\\.3\\.1",
  ],
  "aria-hidden-focusable": [
    'aria-hidden.*focusable',
    'focusable.*aria-hidden',
    'aria-hidden="true".*focus',
  ],
  "form-field-multiple-labels": [
    "multiple label",
    "duplicate label",
  ],
  "autocomplete-valid": [
    "autocomplete",
    "autocomplete.*attribute",
    "1\\.3\\.5",
  ],
};

/**
 * Check if the output text mentions a given axe-core rule category.
 *
 * @param {string} text - The report text (lowercased)
 * @param {string} ruleId - The axe-core rule ID
 * @returns {boolean}
 */
function mentionsRule(text, ruleId) {
  const patterns = AXE_RULE_MAP[ruleId];
  if (!patterns) {
    // Fall back to direct text search for unknown rules
    return new RegExp(ruleId.replace(/-/g, "."), "i").test(text);
  }

  return patterns.some((pattern) => new RegExp(pattern, "i").test(text));
}

/**
 * Main grader function.
 *
 * @param {string} output - Agent output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string }}
 */
function grade(output, context) {
  const text = (output || "").toLowerCase();
  const vars = context.vars || {};

  const expected = vars.expectedViolations || [];
  const unexpected = vars.unexpectedViolations || [];

  if (expected.length === 0 && unexpected.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "No violation checks specified — skipping",
    };
  }

  const found = [];
  const missed = [];
  const falsePositives = [];

  // Check expected violations are mentioned
  for (const rule of expected) {
    if (mentionsRule(text, rule)) {
      found.push(rule);
    } else {
      missed.push(rule);
    }
  }

  // Check unexpected violations are NOT mentioned
  for (const rule of unexpected) {
    if (mentionsRule(text, rule)) {
      falsePositives.push(rule);
    }
  }

  const expectedScore =
    expected.length > 0 ? found.length / expected.length : 1;
  const unexpectedPenalty =
    unexpected.length > 0
      ? falsePositives.length / unexpected.length
      : 0;

  // Score: proportion of expected found, penalized by false positives
  const score = Math.max(0, expectedScore - unexpectedPenalty * 0.5);
  const pass = missed.length === 0 && falsePositives.length === 0;

  const reasons = [];
  if (found.length > 0) {
    reasons.push(`Found ${found.length}/${expected.length} expected: ${found.join(", ")}`);
  }
  if (missed.length > 0) {
    reasons.push(`Missed ${missed.length}: ${missed.join(", ")}`);
  }
  if (falsePositives.length > 0) {
    reasons.push(`False positives: ${falsePositives.join(", ")}`);
  }

  return {
    pass,
    score,
    reason: reasons.join(". ") || "All checks passed",
  };
}

module.exports = grade;
