/**
 * Report Generator Module
 * Generates downloadable reports in JSON format
 */

const { v4: uuidv4 } = require('uuid');

function generateReport(scanResults) {
  const report = {
    reportId: uuidv4(),
    generatedAt: new Date().toISOString(),
    reportVersion: '1.0',
    
    // Summary
    summary: {
      projectName: scanResults.projectName || 'Unknown Project',
      trustScore: scanResults.trustScore.score,
      riskLevel: scanResults.trustScore.riskLevel,
      totalDependencies: scanResults.trustScore.summary.totalDependencies,
      directDependencies: scanResults.trustScore.summary.directDependencies,
      totalVulnerabilities: scanResults.trustScore.summary.totalVulnerabilities,
      suspiciousPackages: scanResults.trustScore.summary.suspiciousPackages,
    },

    // Trust Score Details
    trustScore: scanResults.trustScore,

    // SBOM
    sbom: scanResults.sbom,

    // Vulnerability Analysis
    vulnerabilities: {
      summary: scanResults.vulnerabilities.summary,
      vulnerablePackages: scanResults.vulnerabilities.vulnerablePackages.map((pkg) => ({
        package: pkg.package,
        version: pkg.version,
        vulnerabilities: pkg.vulnerabilities.map((v) => ({
          id: v.id,
          summary: v.summary,
          severity: v.severity,
          aliases: v.aliases,
        })),
      })),
    },

    // Suspicious Packages
    suspiciousPackages: scanResults.similarityResults,

    // Recommendations
    recommendations: scanResults.trustScore.recommendation,

    // Metadata
    metadata: {
      scanDuration: scanResults.scanDuration || 'N/A',
      toolVersion: '1.0.0',
      apiEndpoints: ['OSV.dev', 'npm Registry'],
    },
  };

  return report;
}

// In-memory store for scan history
const scanHistory = [];

function saveToHistory(report) {
  scanHistory.push({
    id: report.reportId,
    timestamp: report.generatedAt,
    projectName: report.summary.projectName,
    trustScore: report.summary.trustScore,
    riskLevel: report.summary.riskLevel,
    totalDeps: report.summary.totalDependencies,
    vulnerabilities: report.summary.totalVulnerabilities,
    suspicious: report.summary.suspiciousPackages,
  });

  // Keep only last 50 scans
  if (scanHistory.length > 50) {
    scanHistory.shift();
  }
}

function getHistory() {
  return [...scanHistory].reverse();
}

module.exports = { generateReport, saveToHistory, getHistory };
