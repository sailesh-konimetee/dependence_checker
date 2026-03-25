/**
 * Trust Score Engine
 * Calculates a trust score (0-100) based on vulnerability and similarity analysis
 */

const SEVERITY_WEIGHTS = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  unknown: 5,
};

const SUSPICIOUS_WEIGHTS = {
  HIGH: 20,
  MEDIUM: 10,
};

/**
 * Calculate the trust score
 * @param {Object} vulnerabilityResults - Results from vulnerability scanner
 * @param {Object} similarityResults - Results from similarity detector
 * @param {Object} sbom - SBOM data
 * @returns {Object} Trust score breakdown
 */
function calculateTrustScore(vulnerabilityResults, similarityResults, sbom) {
  let deductions = 0;
  const breakdown = {
    vulnerabilityDeductions: 0,
    suspiciousDeductions: 0,
    details: [],
  };

  // --- Vulnerability deductions ---
  const summary = vulnerabilityResults.summary;

  const vulnDeduction =
    summary.critical * SEVERITY_WEIGHTS.critical +
    summary.high * SEVERITY_WEIGHTS.high +
    summary.medium * SEVERITY_WEIGHTS.medium +
    summary.low * SEVERITY_WEIGHTS.low +
    summary.unknown * SEVERITY_WEIGHTS.unknown;

  breakdown.vulnerabilityDeductions = vulnDeduction;

  if (summary.critical > 0) {
    breakdown.details.push({
      type: 'CRITICAL_VULNS',
      message: `${summary.critical} critical vulnerabilities found (-${summary.critical * SEVERITY_WEIGHTS.critical} points)`,
      impact: summary.critical * SEVERITY_WEIGHTS.critical,
    });
  }
  if (summary.high > 0) {
    breakdown.details.push({
      type: 'HIGH_VULNS',
      message: `${summary.high} high severity vulnerabilities found (-${summary.high * SEVERITY_WEIGHTS.high} points)`,
      impact: summary.high * SEVERITY_WEIGHTS.high,
    });
  }
  if (summary.medium > 0) {
    breakdown.details.push({
      type: 'MEDIUM_VULNS',
      message: `${summary.medium} medium severity vulnerabilities found (-${summary.medium * SEVERITY_WEIGHTS.medium} points)`,
      impact: summary.medium * SEVERITY_WEIGHTS.medium,
    });
  }
  if (summary.low > 0) {
    breakdown.details.push({
      type: 'LOW_VULNS',
      message: `${summary.low} low severity vulnerabilities found (-${summary.low * SEVERITY_WEIGHTS.low} points)`,
      impact: summary.low * SEVERITY_WEIGHTS.low,
    });
  }

  deductions += vulnDeduction;

  // --- Suspicious package deductions ---
  let suspDeduction = 0;
  for (const susp of similarityResults.suspicious) {
    const weight = SUSPICIOUS_WEIGHTS[susp.riskLevel] || 10;
    suspDeduction += weight;
    breakdown.details.push({
      type: 'SUSPICIOUS_PKG',
      message: `Suspicious package "${susp.package}" (${susp.riskLevel} risk) - ${susp.reason} (-${weight} points)`,
      impact: weight,
    });
  }
  breakdown.suspiciousDeductions = suspDeduction;
  deductions += suspDeduction;

  // --- Calculate final score ---
  const rawScore = Math.max(0, 100 - deductions);
  const score = Math.round(rawScore);

  // Determine risk level
  let riskLevel, color;
  if (score >= 80) {
    riskLevel = 'SAFE';
    color = 'green';
  } else if (score >= 50) {
    riskLevel = 'MODERATE';
    color = 'yellow';
  } else {
    riskLevel = 'HIGH_RISK';
    color = 'red';
  }

  return {
    score,
    maxScore: 100,
    riskLevel,
    color,
    totalDeductions: deductions,
    breakdown,
    summary: {
      totalDependencies: sbom.totalComponents || 0,
      directDependencies: sbom.directDependencies || 0,
      totalVulnerabilities: summary.total,
      criticalVulnerabilities: summary.critical,
      highVulnerabilities: summary.high,
      mediumVulnerabilities: summary.medium,
      lowVulnerabilities: summary.low,
      suspiciousPackages: similarityResults.suspiciousCount,
    },
    recommendation: getRecommendation(score, summary, similarityResults),
  };
}

function getRecommendation(score, vulnSummary, similarityResults) {
  const recommendations = [];

  if (vulnSummary.critical > 0) {
    recommendations.push('🚨 URGENT: Update or replace packages with critical vulnerabilities immediately.');
  }
  if (vulnSummary.high > 0) {
    recommendations.push('⚠️ Update packages with high severity vulnerabilities as soon as possible.');
  }
  if (similarityResults.highRisk > 0) {
    recommendations.push('🔍 Investigate high-risk suspicious packages - they may be typosquatting attacks.');
  }
  if (vulnSummary.medium > 0) {
    recommendations.push('📋 Review and plan updates for packages with medium severity vulnerabilities.');
  }
  if (score >= 80) {
    recommendations.push('✅ Your dependency chain looks healthy. Continue monitoring regularly.');
  }

  return recommendations;
}

module.exports = { calculateTrustScore };
