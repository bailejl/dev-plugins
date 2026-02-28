/**
 * evals/frontend-dev/graders/deterministic/file-structure.js
 *
 * Deterministic grader that verifies the agent created the expected files
 * with required content patterns. Used primarily by scaffolding.yaml to
 * check that scaffold-component produces the right file structure.
 *
 * @param {string} output - The agent's output (not directly used; checks filesystem)
 * @param {Object} context - Promptfoo context with vars
 * @param {string} context.vars.baseDir - Base directory to check
 * @param {Object[]} context.vars.expectedFiles - Files that should exist
 * @param {string} context.vars.expectedFiles[].path - Relative path from baseDir
 * @param {string[]} [context.vars.expectedFiles[].patterns] - Regex patterns the file should contain
 * @param {string[]} [context.vars.expectedFiles[].antiPatterns] - Patterns the file should NOT contain
 * @param {number} [context.vars.expectedFiles[].minLines] - Minimum line count
 * @param {number} [context.vars.expectedFiles[].maxLines] - Maximum line count
 * @param {string[]} [context.vars.unexpectedFiles] - Relative paths that should NOT exist
 * @returns {{ pass: boolean, score: number, reason: string }}
 */

const fs = require("fs");
const path = require("path");

/**
 * Check a single file against its expectations.
 *
 * @param {string} baseDir - Base directory
 * @param {Object} fileSpec - File specification
 * @returns {{ exists: boolean, errors: string[] }}
 */
function checkFile(baseDir, fileSpec) {
  const fullPath = path.resolve(baseDir, fileSpec.path);
  const errors = [];

  if (!fs.existsSync(fullPath)) {
    return { exists: false, errors: [`File not found: ${fileSpec.path}`] };
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");

  // Check content patterns
  if (fileSpec.patterns) {
    for (const pattern of fileSpec.patterns) {
      const regex = new RegExp(pattern, "i");
      if (!regex.test(content)) {
        errors.push(
          `${fileSpec.path}: missing expected pattern "${pattern}"`
        );
      }
    }
  }

  // Check anti-patterns
  if (fileSpec.antiPatterns) {
    for (const pattern of fileSpec.antiPatterns) {
      const regex = new RegExp(pattern, "i");
      if (regex.test(content)) {
        errors.push(
          `${fileSpec.path}: contains unwanted pattern "${pattern}"`
        );
      }
    }
  }

  // Check line count bounds
  if (fileSpec.minLines && lines.length < fileSpec.minLines) {
    errors.push(
      `${fileSpec.path}: too short (${lines.length} lines, min: ${fileSpec.minLines})`
    );
  }
  if (fileSpec.maxLines && lines.length > fileSpec.maxLines) {
    errors.push(
      `${fileSpec.path}: too long (${lines.length} lines, max: ${fileSpec.maxLines})`
    );
  }

  return { exists: true, errors };
}

/**
 * Main grader function.
 *
 * @param {string} output - Agent output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string }}
 */
function grade(output, context) {
  const vars = context.vars || {};
  const baseDir = vars.baseDir;
  const expectedFiles = vars.expectedFiles || [];
  const unexpectedFiles = vars.unexpectedFiles || [];

  if (!baseDir) {
    return {
      pass: false,
      score: 0,
      reason: "No baseDir specified in vars",
    };
  }

  if (!fs.existsSync(baseDir)) {
    return {
      pass: false,
      score: 0,
      reason: `Base directory not found: ${baseDir}`,
    };
  }

  const allErrors = [];
  let filesFound = 0;
  let totalExpected = expectedFiles.length;

  // Check expected files
  for (const fileSpec of expectedFiles) {
    const result = checkFile(baseDir, fileSpec);
    if (result.exists) {
      filesFound++;
    }
    allErrors.push(...result.errors);
  }

  // Check unexpected files don't exist
  for (const relPath of unexpectedFiles) {
    const fullPath = path.resolve(baseDir, relPath);
    if (fs.existsSync(fullPath)) {
      allErrors.push(`Unexpected file exists: ${relPath}`);
    }
  }

  // Compute score
  const totalChecks = totalExpected + unexpectedFiles.length;
  if (totalChecks === 0) {
    return { pass: true, score: 1, reason: "No file checks specified" };
  }

  const checksOk = totalChecks - allErrors.length;
  const score = Math.max(0, checksOk / totalChecks);
  const pass = allErrors.length === 0;

  const reasons = [];
  if (filesFound > 0) {
    reasons.push(`${filesFound}/${totalExpected} expected files found`);
  }
  if (allErrors.length > 0) {
    reasons.push(`${allErrors.length} issue(s): ${allErrors.slice(0, 5).join("; ")}`);
    if (allErrors.length > 5) {
      reasons.push(`... and ${allErrors.length - 5} more`);
    }
  } else {
    reasons.push("All file structure checks passed");
  }

  return {
    pass,
    score,
    reason: reasons.join(". "),
  };
}

module.exports = grade;
