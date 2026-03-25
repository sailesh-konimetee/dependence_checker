/**
 * Similarity Detector Module
 * Uses Levenshtein Distance to detect typosquatting attacks
 * Compares package names against known popular packages
 */

// Popular npm packages that are commonly typosquatted
const POPULAR_PACKAGES = [
  // Frontend Frameworks
  'react', 'react-dom', 'react-router', 'react-router-dom', 'react-redux',
  'vue', 'vuex', 'vue-router', 'angular', 'svelte',
  'next', 'nuxt', 'gatsby', 'remix',
  
  // State Management
  'redux', 'mobx', 'zustand', 'recoil', 'jotai',
  
  // Build Tools
  'webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'babel',
  'typescript', 'eslint', 'prettier',
  
  // Backend
  'express', 'fastify', 'koa', 'hapi', 'nest', 'nestjs',
  'mongoose', 'sequelize', 'prisma', 'typeorm',
  
  // Utilities
  'lodash', 'underscore', 'ramda', 'moment', 'dayjs', 'date-fns',
  'axios', 'node-fetch', 'got', 'request', 'superagent',
  'chalk', 'commander', 'inquirer', 'yargs',
  'uuid', 'nanoid', 'crypto-js',
  
  // Testing
  'jest', 'mocha', 'chai', 'sinon', 'cypress', 'playwright',
  'vitest', 'testing-library',
  
  // CSS
  'tailwindcss', 'styled-components', 'emotion', 'sass', 'less',
  'postcss', 'autoprefixer',
  
  // Security
  'helmet', 'cors', 'jsonwebtoken', 'bcrypt', 'bcryptjs',
  'passport', 'dotenv',
  
  // Other popular
  'socket.io', 'ws', 'cheerio', 'puppeteer', 'sharp',
  'nodemailer', 'multer', 'formidable',
  'winston', 'pino', 'morgan', 'debug',
  'async', 'bluebird', 'rxjs',
];

/**
 * Calculate Levenshtein Distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Fill base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity ratio (0-1, where 1 is identical)
 */
function similarityRatio(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Check common typosquatting patterns
 */
function checkTyposquattingPatterns(packageName) {
  const patterns = [];

  // Check for extra/missing hyphens
  const withHyphen = packageName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const withoutHyphen = packageName.replace(/-/g, '');

  // Check for common character substitutions
  const substitutions = {
    '0': 'o', 'o': '0',
    '1': 'l', 'l': '1',
    'rn': 'm', 'm': 'rn',
    'vv': 'w', 'w': 'vv',
  };

  // Check for scope mimicking (e.g., @types-lodash vs @types/lodash)
  if (packageName.includes('-') && !packageName.startsWith('@')) {
    const parts = packageName.split('-');
    if (['types', 'babel', 'eslint', 'rollup', 'jest', 'testing'].includes(parts[0])) {
      patterns.push({
        type: 'scope_mimicking',
        detail: `Package "${packageName}" may be mimicking scoped package "@${parts[0]}/${parts.slice(1).join('-')}"`,
      });
    }
  }

  return patterns;
}

/**
 * Detect suspicious packages using Levenshtein distance
 */
function detectSuspiciousPackages(packageNames) {
  const results = [];

  for (const pkgName of packageNames) {
    // Skip if it's an exact match with a popular package
    if (POPULAR_PACKAGES.includes(pkgName)) continue;

    // Strip scope for comparison
    const baseName = pkgName.startsWith('@') ? pkgName.split('/').pop() : pkgName;
    
    const suspiciousMatches = [];

    for (const popular of POPULAR_PACKAGES) {
      const distance = levenshteinDistance(baseName.toLowerCase(), popular.toLowerCase());
      const ratio = similarityRatio(baseName.toLowerCase(), popular.toLowerCase());

      // Flag if very similar but not identical (distance 1-2 for short names, 1-3 for longer)
      const threshold = popular.length <= 4 ? 1 : popular.length <= 8 ? 2 : 3;

      // Handle case-variance (e.g. 'lodasH' vs 'lodash')
      const isCaseVariant = distance === 0 && baseName !== popular;

      if ((distance > 0 && distance <= threshold && ratio >= 0.6) || isCaseVariant) {
        suspiciousMatches.push({
          similarTo: popular,
          distance: isCaseVariant ? 1 : distance,
          similarity: isCaseVariant ? 99 : Math.round(ratio * 100),
        });
      }
    }

    // Check typosquatting patterns
    const patterns = checkTyposquattingPatterns(pkgName);

    if (suspiciousMatches.length > 0 || patterns.length > 0) {
      // Sort by closest match
      suspiciousMatches.sort((a, b) => a.distance - b.distance);

      results.push({
        package: pkgName,
        isSuspicious: true,
        riskLevel: suspiciousMatches.some((m) => m.distance === 1) ? 'HIGH' : 'MEDIUM',
        closestMatch: suspiciousMatches[0] || null,
        allMatches: suspiciousMatches,
        patterns,
        reason: suspiciousMatches.length > 0
          ? `Package "${pkgName}" is very similar to popular package "${suspiciousMatches[0].similarTo}" (${suspiciousMatches[0].similarity}% similar, distance: ${suspiciousMatches[0].distance})`
          : patterns[0]?.detail || 'Suspicious naming pattern detected',
      });
    }
  }

  return {
    suspicious: results,
    suspiciousCount: results.length,
    highRisk: results.filter((r) => r.riskLevel === 'HIGH').length,
    mediumRisk: results.filter((r) => r.riskLevel === 'MEDIUM').length,
  };
}

module.exports = { detectSuspiciousPackages, levenshteinDistance, similarityRatio };
