import React, { useState } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';

export default function SBOMView({ sbom }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | dependency | devDependency

  const components = sbom.components || [];

  const filtered = components.filter((comp) => {
    const matchesSearch = comp.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || comp.scope === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages..."
            className="w-full pl-10 pr-4 py-2 bg-surface-900/80 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:border-brand-500/50 focus:outline-none transition-all"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          {[
            { id: 'all', label: `All (${components.length})` },
            { id: 'dependency', label: 'Dependencies' },
            { id: 'devDependency', label: 'DevDeps' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* SBOM Info */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-white font-mono">{sbom.totalComponents}</div>
            <div className="text-[10px] text-slate-500">Total Components</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{sbom.directDependencies}</div>
            <div className="text-[10px] text-slate-500">Direct Dependencies</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {components.filter((c) => c.scope === 'dependency').length}
            </div>
            <div className="text-[10px] text-slate-500">Production</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {components.filter((c) => c.scope === 'devDependency').length}
            </div>
            <div className="text-[10px] text-slate-500">Dev Only</div>
          </div>
        </div>
      </div>

      {/* Package list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Package</th>
              <th>Version</th>
              <th>Scope</th>
              <th>Depth</th>
              <th>PURL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((comp, i) => (
              <tr key={i}>
                <td className="font-mono text-white font-medium">{comp.name}</td>
                <td className="font-mono text-slate-400">{comp.version}</td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${
                    comp.scope === 'dependency'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {comp.scope === 'dependency' ? 'prod' : 'dev'}
                  </span>
                </td>
                <td className="text-slate-500 font-mono">{comp.depth}</td>
                <td className="text-slate-600 font-mono text-xs truncate max-w-[200px]">{comp.purl}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            No packages match your search.
          </div>
        )}
      </div>
    </div>
  );
}
