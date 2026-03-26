const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { generateSBOM } = require('./modules/sbomGenerator');
const { scanAllPackages } = require('./modules/vulnerabilityScanner');
const { detectSuspiciousPackages, POPULAR_PACKAGES } = require('./modules/similarityDetector');
const { performStaticAnalysis } = require('./modules/staticAnalyzer');
const { calculateTrustScore } = require('./modules/trustScoreEngine');
const { generateReport, saveToHistory, getHistory } = require('./modules/reportGenerator');
const { getExplanation, getReportExplanation } = require('./modules/aiExplainer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.originalname === 'package.json' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only package.json files are allowed'), false);
    }
  },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main scan endpoint - file upload
app.post('/api/scan/upload', upload.single('packageJson'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a package.json file.' });
    }

    const packageJson = JSON.parse(req.file.buffer.toString('utf-8'));
    const result = await performScan(packageJson);
    res.json(result);
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

// Main scan endpoint - JSON body
app.post('/api/scan/json', async (req, res) => {
  try {
    const packageJson = req.body;
    if (!packageJson || (!packageJson.dependencies && !packageJson.devDependencies)) {
      return res.status(400).json({ error: 'Invalid package.json. Must contain dependencies or devDependencies.' });
    }

    const result = await performScan(packageJson);
    res.json(result);
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

// Get scan history
app.get('/api/history', (req, res) => {
  res.json(getHistory());
});

// AI Explanation Endpoint
app.post('/api/explain', async (req, res) => {
  try {
    const { package: packageName, vulnerabilities, similarityInfo } = req.body;
    
    if (!packageName) {
      return res.status(400).json({ error: 'Package name is required for explanation.' });
    }

    const explanationResult = await getExplanation(packageName, vulnerabilities, similarityInfo);
    
    if (!explanationResult.success) {
      return res.status(503).json(explanationResult);
    }
    
    res.json(explanationResult);
  } catch (err) {
    console.error('AI Explanation error:', err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// AI Report Explanation Endpoint
app.post('/api/explain-report', async (req, res) => {
  try {
    const { trustScore, riskLevel, issues } = req.body;
    
    const explanationResult = await getReportExplanation(trustScore, riskLevel, issues);
    
    if (!explanationResult.success) {
      return res.status(503).json(explanationResult);
    }
    
    res.json(explanationResult);
  } catch (err) {
    console.error('AI Report Explanation error:', err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Core scan function
async function performScan(packageJson) {
  const startTime = Date.now();

  let projectName = packageJson.name || 'Unknown Project';
  projectName = projectName.replace(/-(frontend|backend)$/i, '');
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  console.log(`\n🔍 Starting scan for "${projectName}"...`);
  console.log(`   Dependencies: ${Object.keys(dependencies).length}`);
  console.log(`   DevDependencies: ${Object.keys(devDependencies).length}`);

  // Step 1: Generate SBOM (Full Depth traversal)
  console.log('📦 Generating SBOM (Full Depth)...');
  // Passing Infinity allows the SBOM generator to fetch all nested transitives until exhausted
  const sbom = await generateSBOM(dependencies, devDependencies, Infinity);
  console.log(`   Found ${sbom.totalComponents} total components`);

  // Step 2: Scan for vulnerabilities
  console.log('🛡️  Scanning for vulnerabilities...');
  const vulnerabilities = await scanAllPackages(sbom.components);
  console.log(`   Found ${vulnerabilities.summary.total} vulnerabilities`);

  // Step 3: Detect suspicious packages
  console.log('🔎 Checking for suspicious packages...');
  const allPackageNames = sbom.components.map((c) => c.name);
  const similarityResults = detectSuspiciousPackages(allPackageNames);

  // Mix in fake packages (Dependency Confusion risk)
  const fakePackages = sbom.components.filter(c => c.isFake);
  for (const fakePkg of fakePackages) {
    if (!similarityResults.suspicious.some(s => s.package === fakePkg.name)) {
      similarityResults.suspicious.push({
        package: fakePkg.name,
        isSuspicious: true,
        riskLevel: 'HIGH',
        closestMatch: null,
        allMatches: [],
        patterns: [{ type: 'unregistered', detail: `Package missing from npm registry` }],
        reason: `Package "${fakePkg.name}" does NOT exist on the npm registry! This is a severe Dependency Confusion / malicious placeholder risk.`
      });
      similarityResults.suspiciousCount++;
      similarityResults.highRisk++;
    }
  }

  console.log(`   Found ${similarityResults.suspiciousCount} suspicious packages`);

  // Step 3.5: Static Code Analysis
  console.log('📖 Performing Static Code Analysis...');
  const staticAnalysis = await performStaticAnalysis(sbom.components);
  
  const alreadySuspiciousPackages = new Set(similarityResults.suspicious.map(s => s.package));
  
  for (const finding of staticAnalysis.findings) {
    // Only flag behavioral issues if the package is ALREADY flagged for typosquatting/fake
    if (!alreadySuspiciousPackages.has(finding.package)) {
      continue;
    }

    // Embed the static analysis findings INTO the existing similarity alert
    const existingEntry = similarityResults.suspicious.find(s => s.package === finding.package);
    if (existingEntry) {
      existingEntry.patterns.push(...finding.flags.map(f => ({ type: f.type, detail: f.description })));
      existingEntry.reason += ` | Behavior Alert: ${finding.flags.map(f => f.type).join(', ')}.`;
      existingEntry.riskScore = Math.max(existingEntry.riskScore || 0, finding.riskScore);
      
      if (finding.riskScore >= 50 && existingEntry.riskLevel !== 'HIGH') {
        existingEntry.riskLevel = 'HIGH';
        similarityResults.highRisk++;
        similarityResults.mediumRisk = Math.max(0, similarityResults.mediumRisk - 1);
      }
    }
  }
  console.log(`   Processed static analysis on similarity flagged packages.`);

  // Step 4: Calculate trust score
  console.log('📊 Calculating trust score...');
  const trustScore = calculateTrustScore(vulnerabilities, similarityResults, sbom);
  console.log(`   Trust Score: ${trustScore.score}/100 (${trustScore.riskLevel})`);

  const scanDuration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

  // Build results
  const scanResults = {
    projectName,
    sbom,
    vulnerabilities,
    similarityResults,
    trustScore,
    scanDuration,
  };

  // Generate report and save to history
  const report = generateReport(scanResults);
  saveToHistory(report);

  console.log(`✅ Scan complete in ${scanDuration}\n`);

  return {
    success: true,
    projectName,
    scanDuration,
    trustScore,
    sbom: {
      totalComponents: sbom.totalComponents,
      directDependencies: sbom.directDependencies,
      components: sbom.components,
    },
    vulnerabilities: {
      summary: vulnerabilities.summary,
      vulnerablePackages: vulnerabilities.vulnerablePackages,
    },
    similarityResults,
    report,
  };
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Supply Chain Analyzer API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Upload scan: POST http://localhost:${PORT}/api/scan/upload`);
  console.log(`   JSON scan:   POST http://localhost:${PORT}/api/scan/json\n`);
});
