/**
 * eval-infra/grader-lib/finding-parser.js
 *
 * Shared utility for parsing findings from markdown audit reports.
 * Used by evidence-cited.js and severity-accuracy.js to avoid duplicated parsing logic.
 *
 * @module finding-parser
 */

/**
 * Extract structured findings from markdown audit output.
 * Looks for heading-delimited blocks containing severity indicators and evidence.
 * @param {string} text - The full markdown output
 * @returns {Array<{title: string, severity: string|null, evidence: string[], body: string}>}
 */
function extractFindings(text) {
  // Split on markdown headings (## or ###) that look like findings
  const blocks = text.split(/(?=#{2,3}\s)/).filter(b => b.trim());
  const findings = [];

  for (const block of blocks) {
    const titleMatch = block.match(/^#{2,3}\s+(.+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();

    // Skip non-finding headings (Summary, Recommendations, Scorecard, etc.)
    if (/^(summary|recommendation|scorecard|score|overview|conclusion|appendix|table of contents)/i.test(title)) continue;

    const severity = extractSeverity(block);
    const evidence = extractEvidence(block);

    findings.push({
      title,
      severity,
      evidence,
      body: block,
    });
  }

  return findings;
}

/**
 * Count the number of findings in the output.
 * @param {string} text
 * @returns {number}
 */
function countFindings(text) {
  return extractFindings(text).length;
}

/**
 * Check whether a finding block cites specific evidence.
 * Evidence = file paths with line numbers, code blocks, or git command references.
 * @param {string} block - A single finding's text
 * @param {RegExp[]} [additionalPatterns] - Extra patterns to count as evidence
 * @returns {boolean}
 */
function findingHasEvidence(block, additionalPatterns = []) {
  const evidencePatterns = [
    /[\w/.-]+\.\w+:\d+/,          // file:line references
    /`[^`]+`/,                      // inline code
    /```[\s\S]*?```/,               // code blocks
    /\bgit\s+\w+/,                  // git commands
    /line\s+\d+/i,                  // "line 42" references
    ...additionalPatterns,
  ];

  return evidencePatterns.some(p => p.test(block));
}

// --- Internal helpers ---

function extractSeverity(block) {
  if (/🔴|critical/i.test(block)) return 'critical';
  if (/🟠|high/i.test(block)) return 'high';
  if (/🟡|medium/i.test(block)) return 'medium';
  if (/🔵|low/i.test(block)) return 'low';
  if (/✅|pass/i.test(block)) return 'pass';
  return null;
}

function extractEvidence(block) {
  const evidence = [];

  // File:line references
  const fileRefs = block.match(/[\w/.-]+\.\w+:\d+/g);
  if (fileRefs) evidence.push(...fileRefs);

  // Code blocks
  const codeBlocks = block.match(/```[\s\S]*?```/g);
  if (codeBlocks) evidence.push(...codeBlocks.map(b => b.slice(0, 80) + '...'));

  // Git commands
  const gitCmds = block.match(/\bgit\s+\w+[^\n]*/g);
  if (gitCmds) evidence.push(...gitCmds);

  return evidence;
}

module.exports = { extractFindings, countFindings, findingHasEvidence };
