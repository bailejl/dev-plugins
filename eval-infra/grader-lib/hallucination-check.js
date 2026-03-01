/**
 * eval-infra/grader-lib/hallucination-check.js
 *
 * Detects fabricated file path references in audit output.
 *
 * Checks whether file paths mentioned in the output actually exist in the fixture.
 * Usage in suite YAML:
 *   - type: javascript
 *     value: file://../../eval-infra/grader-lib/hallucination-check.js
 *     metric: hallucination_check
 *     weight: 1
 *
 * Requires vars:
 *   fixtureFiles: comma-separated list of known files in the fixture
 *   OR fixtureRoot: path to fixture directory (grader will list files)
 *
 * @module hallucination-check
 */
module.exports = async function ({ output, vars }) {
  // Extract file path references from output
  // Match patterns like: src/foo.js, ./path/to/file.ts, path/file.py:42
  const pathPattern = /(?:\.\/)?(?:[\w.-]+\/)*[\w.-]+\.\w{1,5}(?::\d+)?/g;
  const referencedPaths = [...new Set((output.match(pathPattern) || []))];

  if (referencedPaths.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: 'No file path references found in output',
    };
  }

  // Get known fixture files
  let knownFiles = [];
  if (vars.fixtureFiles) {
    knownFiles = vars.fixtureFiles.split(',').map(f => f.trim());
  } else if (vars.fixtureRoot) {
    const fs = require('fs');
    const path = require('path');

    function walkDir(dir, prefix = '') {
      const entries = [];
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            entries.push(...walkDir(path.join(dir, entry.name), relPath));
          } else if (entry.isFile()) {
            entries.push(relPath);
          }
        }
      } catch (e) {
        // Directory may not exist in test context
      }
      return entries;
    }

    knownFiles = walkDir(vars.fixtureRoot);
  }

  if (knownFiles.length === 0) {
    return {
      pass: true,
      score: 0.5,
      reason: 'No fixture file list available — hallucination check skipped',
    };
  }

  // Check each referenced path against known files
  const hallucinated = [];
  const verified = [];

  for (const ref of referencedPaths) {
    // Strip line number suffix for matching
    const cleanPath = ref.replace(/:\d+$/, '');

    // Check if any known file matches (by exact match or suffix match)
    const isKnown = knownFiles.some(known =>
      known === cleanPath ||
      known.endsWith(cleanPath) ||
      cleanPath.endsWith(known) ||
      known.endsWith('/' + cleanPath)
    );

    if (isKnown) {
      verified.push(ref);
    } else {
      // Filter out common false positives (npm packages, well-known files)
      const isFalsePositive = /^(node_modules|package\.json|package-lock|\.env|\.git|tsconfig|vite\.config|eslint)/i.test(cleanPath);
      if (!isFalsePositive) {
        hallucinated.push(ref);
      }
    }
  }

  const total = verified.length + hallucinated.length;
  const hallucinationRate = total > 0 ? hallucinated.length / total : 0;

  return {
    pass: hallucinationRate <= 0.1,
    score: Math.max(0, 1 - hallucinationRate),
    reason: hallucinated.length === 0
      ? `All ${verified.length} file references verified against fixture`
      : `${hallucinated.length}/${total} file references not found in fixture: ${hallucinated.slice(0, 5).join(', ')}${hallucinated.length > 5 ? '...' : ''}`,
    componentResults: [
      { name: 'verified_paths', score: verified.length, reason: verified.slice(0, 5).join(', ') },
      { name: 'hallucinated_paths', score: hallucinated.length, reason: hallucinated.join(', ') },
    ],
  };
};
