const fetch = require('node-fetch');

/**
 * SBOM Generator Module
 * Generates a Software Bill of Materials from package.json dependencies
 * Recursively fetches transitive dependencies from npm registry
 */

const NPM_REGISTRY = 'https://registry.npmjs.org';

async function fetchPackageInfo(packageName, version) {
  try {
    const cleanVersion = version.replace(/[\^~>=<]/g, '').split(' ')[0];
    const url = `${NPM_REGISTRY}/${encodeURIComponent(packageName)}/${cleanVersion}`;
    const res = await fetch(url, { timeout: 8000 });
    if (!res.ok) {
      // Try fetching latest if specific version fails
      const fallbackRes = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(packageName)}/latest`, { timeout: 8000 });
      if (!fallbackRes.ok) return null;
      return await fallbackRes.json();
    }
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch info for ${packageName}@${version}: ${err.message}`);
    return null;
  }
}

async function generateSBOM(dependencies, devDependencies = {}, maxDepth = 2) {
  const sbom = {
    bomFormat: 'CustomSBOM',
    specVersion: '1.0',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ name: 'Supply Chain Analyzer', version: '1.0.0' }],
    },
    components: [],
  };

  const visited = new Set();

  async function processPackage(name, version, depth, isDev = false) {
    const key = `${name}@${version}`;
    if (visited.has(key) || depth > maxDepth) return;
    visited.add(key);

    const cleanVersion = version.replace(/[\^~>=<]/g, '').split(' ')[0];

    const component = {
      type: 'library',
      name,
      version: cleanVersion,
      purl: `pkg:npm/${name}@${cleanVersion}`,
      scope: isDev ? 'devDependency' : 'dependency',
      depth,
      transitiveDependencies: [],
    };

    if (depth < maxDepth) {
      const pkgInfo = await fetchPackageInfo(name, version);
      if (pkgInfo && pkgInfo.dependencies) {
        const transDeps = Object.entries(pkgInfo.dependencies);
        component.transitiveDependencies = transDeps.map(([n, v]) => ({
          name: n,
          version: v.replace(/[\^~>=<]/g, '').split(' ')[0],
        }));

        // Process transitive dependencies concurrently (batch of 5)
        for (let i = 0; i < transDeps.length; i += 5) {
          const batch = transDeps.slice(i, i + 5);
          await Promise.all(
            batch.map(([n, v]) => processPackage(n, v, depth + 1, isDev))
          );
        }
      }
    }

    sbom.components.push(component);
  }

  // Process direct dependencies
  const allDeps = [
    ...Object.entries(dependencies || {}).map(([n, v]) => ({ name: n, version: v, isDev: false })),
    ...Object.entries(devDependencies || {}).map(([n, v]) => ({ name: n, version: v, isDev: true })),
  ];

  // Process in batches of 5
  for (let i = 0; i < allDeps.length; i += 5) {
    const batch = allDeps.slice(i, i + 5);
    await Promise.all(
      batch.map((dep) => processPackage(dep.name, dep.version, 0, dep.isDev))
    );
  }

  sbom.totalComponents = sbom.components.length;
  sbom.directDependencies = Object.keys(dependencies || {}).length + Object.keys(devDependencies || {}).length;

  return sbom;
}

module.exports = { generateSBOM };
