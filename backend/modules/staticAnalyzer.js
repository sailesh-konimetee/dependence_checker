const fetch = require('node-fetch');
const zlib = require('zlib');

/**
 * Static Code Analyzer
 * Scans package.json scripts and component tarballs for heuristic risks.
 */

async function analyzePackageCode(component) {
  let riskScore = 0;
  const flags = [];
  let usesExec = false;
  let hasPostInstall = false;
  let networkCall = false;
  let usesEval = false;
  let fileAccess = false;

  try {
    // 1. Fetch registry data
    const cleanVersion = component.version.replace(/[\^~>=<]/g, '').split(' ')[0] || component.version;
    const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(component.name)}/${cleanVersion}`;
    const res = await fetch(registryUrl, { timeout: 4000 });
    
    if (!res.ok) {
      return { package: component.name, version: component.version, riskScore: 0, flags: [], status: 'fetch_failed' };
    }
    const registryData = await res.json();

    // 2. Install Script Check
    const scripts = registryData.scripts || {};
    const dangerousScripts = ['preinstall', 'install', 'postinstall'];
    for (const scriptName of dangerousScripts) {
      if (scripts[scriptName]) {
        hasPostInstall = true;
        flags.push({ 
          type: 'INSTALL_SCRIPT', 
          description: `Has dangerous "${scriptName}" script: \`${scripts[scriptName]}\``
        });
        break;
      }
    }

    // 3. Tarball scan
    const tarballUrl = registryData?.dist?.tarball;
    if (tarballUrl) {
      const tarRes = await fetch(tarballUrl, { timeout: 5000 });
      if (tarRes.ok) {
        const buffer = await tarRes.buffer();
        try {
          // It's usually gzipped
          const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
          const unzippedBuffer = isGzip ? zlib.gunzipSync(buffer) : buffer;
          const tarString = unzippedBuffer.toString('utf8');

          // Heuristics
          if (/require\(["']child_process["']\)/i.test(tarString) || /\.exec\(/i.test(tarString) || /execSync\(/i.test(tarString)) {
            usesExec = true;
            flags.push({ type: 'CHILD_PROCESS', description: 'Requires child_process or exec() - potential shell execution' });
          }
          if (/require\(["'](http|https|net|axios|node-fetch)["']\)/i.test(tarString) || /fetch\(/i.test(tarString)) {
            networkCall = true;
            flags.push({ type: 'NETWORK', description: 'Network usage (http/https/axios/fetch) detected in code' });
          }
          if (/eval\(/i.test(tarString)) {
            usesEval = true;
            flags.push({ type: 'EVAL', description: 'Uses eval() - dangerous dynamic code execution' });
          }
          if (/require\(["']fs["']\)/i.test(tarString) || /fs\./.test(tarString)) {
            fileAccess = true;
            flags.push({ type: 'FILE_SYSTEM', description: 'Accesses the file system' });
          }
        } catch(e) {
          // ignore gunzip errors or out of memory
        }
      }
    }

  } catch (err) {
    // timeout or network error, skip quietly to not block the main process
  }

  // 4. Scoring logic as requested
  if (usesExec) riskScore += 30;
  if (hasPostInstall) riskScore += 30;
  if (networkCall) riskScore += 20;
  
  // Custom additions for completeness
  if (usesEval) riskScore += 10;
  if (fileAccess) riskScore += 0; // Don't penalize inherently for fs, just flag it

  return {
    package: component.name,
    version: component.version,
    riskScore,
    flags
  };
}

async function performStaticAnalysis(components) {
  const results = [];
  let analyzeCount = 0;
  
  // Concurrency batch processing
  const BATCH_SIZE = 15;
  for (let i = 0; i < components.length; i += BATCH_SIZE) {
    const batch = components.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(c => analyzePackageCode(c)));
    results.push(...batchResults.filter(r => r && r.riskScore > 0));
    analyzeCount += batch.length;
  }

  const riskScoreDeduction = results.reduce((acc, curr) => acc + curr.riskScore, 0);

  return {
    scannedCount: analyzeCount,
    findings: results,
    totalDeductions: riskScoreDeduction
  };
}

module.exports = { performStaticAnalysis };
