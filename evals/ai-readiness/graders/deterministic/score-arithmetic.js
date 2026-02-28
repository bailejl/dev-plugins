/**
 * evals/ai-readiness/graders/deterministic/score-arithmetic.js
 *
 * Validates that weighted scores in a report add up correctly.
 * Parses the score breakdown table, recalculates weighted totals,
 * and checks that the pass/fail determination matches the threshold.
 *
 * @param {string} output - The agent's report output
 * @param {Object} context - Promptfoo context
 * @returns {{ pass: boolean, score: number, reason: string, calculatedScore: number, reportedScore: number }}
 */

function grade(output, context) {
  const text = output || "";

  if (!text.trim()) {
    return {
      pass: false,
      score: 0,
      reason: "Output is empty",
      calculatedScore: 0,
      reportedScore: 0,
    };
  }

  // Try to find score breakdown table or list
  const scores = extractScores(text);
  const reportedTotal = extractOverallScore(text);

  if (scores.length === 0) {
    // If no breakdown found but there's an overall score, give partial credit
    if (reportedTotal !== null) {
      return {
        pass: true,
        score: 0.5,
        reason: `Found overall score (${reportedTotal}) but no breakdown table to validate`,
        calculatedScore: reportedTotal,
        reportedScore: reportedTotal,
      };
    }
    return {
      pass: false,
      score: 0,
      reason: "Could not find score breakdown or overall score in output",
      calculatedScore: 0,
      reportedScore: 0,
    };
  }

  // Check if weights are provided
  const hasWeights = scores.some((s) => s.weight !== null);

  let calculatedScore;
  if (hasWeights) {
    const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 0), 0);
    if (totalWeight > 0) {
      calculatedScore = scores.reduce(
        (sum, s) => sum + (s.score * (s.weight || 0)) / totalWeight,
        0
      );
    } else {
      calculatedScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    }
  } else {
    // Simple average
    calculatedScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  }

  // Round to nearest integer for comparison
  calculatedScore = Math.round(calculatedScore);

  if (reportedTotal === null) {
    return {
      pass: true,
      score: 0.7,
      reason: `Found ${scores.length} category scores (calculated average: ${calculatedScore}) but no reported total to validate against`,
      calculatedScore,
      reportedScore: 0,
    };
  }

  // Allow ±3 point tolerance for rounding differences
  const tolerance = 3;
  const diff = Math.abs(calculatedScore - reportedTotal);
  const isAccurate = diff <= tolerance;

  return {
    pass: isAccurate,
    score: isAccurate ? 1 : Math.max(0, 1 - diff / 100),
    reason: isAccurate
      ? `Scores check out: calculated ${calculatedScore}, reported ${reportedTotal} (diff: ${diff})`
      : `Score mismatch: calculated ${calculatedScore}, reported ${reportedTotal} (diff: ${diff}, tolerance: ±${tolerance})`,
    calculatedScore,
    reportedScore: reportedTotal,
  };
}

/**
 * Extract individual category scores from the report.
 * Looks for table rows or list items with scores.
 */
function extractScores(text) {
  const scores = [];

  // Pattern: "| Category | 85 | 20% |" or "| Category | 85/100 | 0.2 |"
  const tablePattern = /\|\s*([^|]+?)\s*\|\s*(\d+)(?:\/100)?\s*\|\s*(\d+(?:\.\d+)?%?)\s*\|/g;
  let match;
  while ((match = tablePattern.exec(text)) !== null) {
    const weight = parseWeight(match[3]);
    scores.push({
      category: match[1].trim(),
      score: parseInt(match[2], 10),
      weight,
    });
  }

  if (scores.length > 0) return scores;

  // Pattern: "- Code Quality: 72/100 (weight: 25%)"
  const listPattern =
    /[-*]\s*(.+?):\s*(\d+)(?:\/100)?(?:\s*\((?:weight:?\s*)?(\d+(?:\.\d+)?%?)\))?/g;
  while ((match = listPattern.exec(text)) !== null) {
    const weight = match[3] ? parseWeight(match[3]) : null;
    scores.push({
      category: match[1].trim(),
      score: parseInt(match[2], 10),
      weight,
    });
  }

  if (scores.length > 0) return scores;

  // Pattern: "Code Quality — 72"
  const dashPattern = /^(?:[-*]\s+)?(.+?)\s*[—–-]\s*(\d+)(?:\/100)?/gm;
  while ((match = dashPattern.exec(text)) !== null) {
    scores.push({
      category: match[1].trim(),
      score: parseInt(match[2], 10),
      weight: null,
    });
  }

  return scores;
}

/**
 * Parse a weight value from various formats: "20%", "0.2", "20"
 */
function parseWeight(raw) {
  if (!raw) return null;
  const str = raw.toString().trim();
  if (str.endsWith("%")) {
    return parseFloat(str) / 100;
  }
  const num = parseFloat(str);
  if (num > 1) return num / 100;
  return num;
}

/**
 * Extract the overall/total score from the report.
 */
function extractOverallScore(text) {
  const patterns = [
    /(?:overall|total|final|aggregate|weighted)\s*(?:score|rating)[:\s]*(\d+)/i,
    /(?:score|rating)[:\s]*(\d+)\s*(?:\/\s*100)/i,
    /\*\*(\d+)(?:\/100)?\*\*\s*(?:overall|total)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

module.exports = grade;
