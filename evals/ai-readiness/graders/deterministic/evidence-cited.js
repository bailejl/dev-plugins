/**
 * evals/ai-readiness/graders/deterministic/evidence-cited.js
 *
 * Validates that findings cite specific evidence such as
 * file paths, line numbers, git commands, or code snippets.
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string, findingsWithEvidence: number, totalFindings: number }}
 */

// Patterns that indicate cited evidence
const EVIDENCE_PATTERNS = [
  // File paths: src/foo.js, ./bar/baz.ts, path/to/file
  /(?:^|\s)[.\w/-]+\.\w{1,5}(?::\d+)?/m,
  // Explicit file:line references: foo.js:42
  /\w+\.\w+:\d+/,
  // Git command references
  /\bgit\s+(?:log|diff|show|blame|branch|status|rev-list|shortlog)\b/i,
  // Code blocks with backticks
  /```[\s\S]*?```/,
  // Inline code references
  /`[^`]{3,}`/,
  // Line number references: "line 42", "L42", "lines 10-20"
  /\blines?\s*\d+/i,
  /\bL\d+/,
];

function grade(output, context) {
  const text = output || "";

  if (!text.trim()) {
    return {
      pass: false,
      score: 0,
      reason: "Output is empty",
      findingsWithEvidence: 0,
      totalFindings: 0,
    };
  }

  // Split report into findings by looking for numbered items, bullet points,
  // or heading-delimited sections that describe issues
  const findingBlocks = extractFindings(text);
  const totalFindings = findingBlocks.length;

  if (totalFindings === 0) {
    // If we can't parse findings, check if the overall report has evidence
    const hasAnyEvidence = EVIDENCE_PATTERNS.some((p) => p.test(text));
    return {
      pass: hasAnyEvidence,
      score: hasAnyEvidence ? 0.5 : 0,
      reason: hasAnyEvidence
        ? "Could not parse individual findings, but report contains evidence references"
        : "No findings or evidence found in output",
      findingsWithEvidence: 0,
      totalFindings: 0,
    };
  }

  let findingsWithEvidence = 0;
  for (const block of findingBlocks) {
    const hasEvidence = EVIDENCE_PATTERNS.some((p) => p.test(block));
    if (hasEvidence) {
      findingsWithEvidence++;
    }
  }

  const score = findingsWithEvidence / totalFindings;
  // Pass if at least 25% of findings cite evidence
  const pass = score >= 0.25;

  return {
    pass,
    score,
    reason: `${findingsWithEvidence}/${totalFindings} findings cite specific evidence (threshold: 25%)`,
    findingsWithEvidence,
    totalFindings,
  };
}

/**
 * Extract individual finding blocks from a report.
 * Looks for numbered lists, bullet points under findings headings,
 * or ### level sub-sections.
 */
function extractFindings(text) {
  const blocks = [];
  const lines = text.split("\n");

  let inFindingsSection = false;
  let currentBlock = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect findings section
    if (/^#{1,3}\s+.*(?:finding|issue|problem|violation|vulnerabilit)/i.test(line)) {
      inFindingsSection = true;
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    // Detect end of findings section (next major heading)
    if (inFindingsSection && /^#{1,2}\s+(?!.*(?:finding|issue))/.test(line)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      inFindingsSection = false;
      continue;
    }

    // Numbered item or sub-heading starts a new finding
    if (/^\d+[\.\)]\s+/.test(line) || /^#{3,4}\s+/.test(line) || /^[-*]\s+\*\*/.test(line)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
      }
      currentBlock = [line];
    } else if (currentBlock.length > 0) {
      currentBlock.push(line);
    } else if (inFindingsSection && line.trim()) {
      currentBlock = [line];
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  // Filter out short blocks (sub-items, brief bullets that aren't standalone findings)
  return blocks.filter((b) => b.length > 80);
}

module.exports = grade;
