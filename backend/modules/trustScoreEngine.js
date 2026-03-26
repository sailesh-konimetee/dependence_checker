/**
 * Trust Score Engine
 * Calculates a trust score (0-100) based on strict percentage of clean packages
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
  const totalPackages = sbom.totalComponents || 1;
  const breakdown = {
    vulnerabilityDeductions: 0,
    suspiciousDeductions: 0,
    details: [],
  };

  // 1. Calculate Trust Score: Ratio of (Total - Suspicious) / Total
  const suspiciousSet = new Set();
  for (const susp of similarityResults.suspicious) {
    if (susp.package) suspiciousSet.add(susp.package);
  }
  const uniqueSuspiciousCount = suspiciousSet.size;
  
  let trustScore = Math.round(((totalPackages - uniqueSuspiciousCount) / totalPackages) * 100);
  trustScore = Math.max(0, Math.min(100, trustScore));

  // 2. Calculate Vulnerability Score: Ratio of (Total - Vulnerable) / Total
  const vulnerableSet = new Set();
  if (vulnerabilityResults.packages && vulnerabilityResults.packages.length > 0) {
    vulnerabilityResults.packages.forEach(pkg => {
      if (pkg.package) vulnerableSet.add(pkg.package);
    });
  }
  const uniqueVulnerableCount = vulnerableSet.size;
  
  let vulnerabilityScore = Math.round(((totalPackages - uniqueVulnerableCount) / totalPackages) * 100);
  vulnerabilityScore = Math.max(0, Math.min(100, vulnerabilityScore));

  // --- Breakdown Details for UI ---
  const summary = vulnerabilityResults.summary;
  let globalVulnDeduction = 0;

  if (summary.critical > 0) {
    const d = summary.critical * SEVERITY_WEIGHTS.critical;
    globalVulnDeduction += d;
    breakdown.details.push({ type: 'CRITICAL_VULNS', message: `${summary.critical} critical vulnerabilities found`, impact: d });
  }
  if (summary.high > 0) {
    const d = summary.high * SEVERITY_WEIGHTS.high;
    globalVulnDeduction += d;
    breakdown.details.push({ type: 'HIGH_VULNS', message: `${summary.high} high severity vulnerabilities found`, impact: d });
  }
  if (summary.medium > 0) {
    const d = summary.medium * SEVERITY_WEIGHTS.medium;
    globalVulnDeduction += d;
    breakdown.details.push({ type: 'MEDIUM_VULNS', message: `${summary.medium} medium severity vulnerabilities found`, impact: d });
  }
  if (summary.low > 0) {
    const d = summary.low * SEVERITY_WEIGHTS.low;
    globalVulnDeduction += d;
    breakdown.details.push({ type: 'LOW_VULNS', message: `${summary.low} low severity vulnerabilities found`, impact: d });
  }

  let globalSuspDeduction = 0;
  for (const susp of similarityResults.suspicious) {
    let weight = susp.riskScore || SUSPICIOUS_WEIGHTS[susp.riskLevel] || 10;
    let isInformational = false;

    if (susp.reason && susp.reason.includes('Static Analysis')) {
      if (weight < 50) {
        weight = 0;
        isInformational = true;
      } else {
        weight = Math.min(30, weight);
      }
    }
    
    globalSuspDeduction += weight;
    breakdown.details.push({
      type: isInformational ? 'INFORMATIONAL_STATIC' : 'STATIC_OR_SUSPICIOUS_PKG',
      message: `Integrity Issue "${susp.package}" (${isInformational ? 'INFO' : susp.riskLevel} risk) - ${susp.reason}`,
      impact: weight,
    });
  }

  breakdown.vulnerabilityDeductions = globalVulnDeduction;
  breakdown.suspiciousDeductions = globalSuspDeduction;

  const totalDeductions = globalVulnDeduction + globalSuspDeduction;

  // Determine OVERALL risk level based on the worst of the two scores
  const overallScore = Math.min(trustScore, vulnerabilityScore);
  let riskLevel, color;
  
  if (overallScore >= 80) {
    riskLevel = 'SAFE';
    color = 'green';
  } else if (overallScore >= 50) {
    riskLevel = 'MODERATE';
    color = 'yellow';
  } else {
    riskLevel = 'HIGH_RISK';
    color = 'red';
  }

  return {
    score: trustScore,
    vulnerabilityScore,
    overallScore,
    maxScore: 100,
    riskLevel,
    color,
    totalDeductions,
    breakdown,
    summary: {
      totalDependencies: totalPackages,
      directDependencies: sbom.directDependencies || 0,
      totalVulnerabilities: summary.total,
      criticalVulnerabilities: summary.critical,
      highVulnerabilities: summary.high,
      mediumVulnerabilities: summary.medium,
      lowVulnerabilities: summary.low,
      suspiciousPackages: uniqueSuspiciousCount,
    },
    recommendation: getRecommendation(overallScore, summary, similarityResults),
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
