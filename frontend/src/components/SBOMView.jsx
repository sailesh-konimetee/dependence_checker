import React, { useState } from 'react';
import { HiMagnifyingGlass, HiFolder, HiDocument, HiChevronRight, HiChevronDown, HiTableCells, HiQueueList } from 'react-icons/hi2';

const TreeNode = ({ node, compMap, level = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const comp = compMap.get(`${node.name}@${node.version}`) || { name: node.name, version: node.version, transitiveDependencies: [], depth: -1 };
  const hasChildren = comp.transitiveDependencies && comp.transitiveDependencies.length > 0;
  
  return (
    <div className="font-mono text-sm">
      <div className="flex items-center group hover:bg-white/5 py-1 rounded transition-colors pr-2" style={{ paddingLeft: `${level * 20}px` }}>
        <button 
          onClick={() => setExpanded(!expanded)} 
          className={`w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white transition-colors ${!hasChildren && 'invisible'}`}
        >
          {expanded ? <HiChevronDown className="w-4 h-4" /> : <HiChevronRight className="w-4 h-4" />}
        </button>
        
        <span className="mr-2">
          {hasChildren ? <HiFolder className="w-4 h-4 text-brand-400" /> : <HiDocument className="w-4 h-4 text-emerald-400/80" />}
        </span>
        
        <span className="text-slate-200 font-medium mr-2">{node.name}</span>
        <span className="text-slate-500 text-xs">v{node.version}</span>
        
        {comp.depth === 0 && (
          <span className={`ml-3 text-[10px] px-1.5 py-0.5 rounded-md ${comp.scope === 'dependency' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
            {comp.scope === 'dependency' ? 'prod' : 'dev'}
          </span>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="border-l border-slate-700/50 ml-[11px] my-0.5">
          {comp.transitiveDependencies.map((child, idx) => (
            <TreeNode 
              key={`${child.name}@${child.version}-${idx}`} 
              node={child} 
              compMap={compMap} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SBOMView({ sbom }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'table'

  const components = sbom.components || [];

  const filtered = components.filter((comp) => {
    const matchesSearch = comp.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || comp.scope === filter;
    return matchesSearch && matchesFilter;
  });

  // For tree view
  const compMap = new Map();
  components.forEach(c => compMap.set(`${c.name}@${c.version}`, c));
  const rootNodes = filtered.filter(c => c.depth === 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative min-w-[200px]">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-2 bg-surface-900/80 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:border-brand-500/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-1">
            {[{ id: 'all', label: `All (${components.length})` }, { id: 'dependency', label: 'Dependencies' }, { id: 'devDependency', label: 'DevDeps' }].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.id ? 'bg-brand-500/15 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-surface-900/80 border border-slate-700/50 rounded-lg p-1">
          <button onClick={() => setViewMode('tree')} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-semibold ${viewMode === 'tree' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            <HiQueueList className="w-4 h-4" /> Tree
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-semibold ${viewMode === 'table' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            <HiTableCells className="w-4 h-4" /> Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div><div className="text-xl font-bold text-white font-mono">{sbom.totalComponents}</div><div className="text-[10px] text-slate-500">Total Components</div></div>
          <div><div className="text-xl font-bold text-white font-mono">{sbom.directDependencies}</div><div className="text-[10px] text-slate-500">Direct Dependencies</div></div>
          <div><div className="text-xl font-bold text-white font-mono">{components.filter((c) => c.scope === 'dependency').length}</div><div className="text-[10px] text-slate-500">Production</div></div>
          <div><div className="text-xl font-bold text-white font-mono">{components.filter((c) => c.scope === 'devDependency').length}</div><div className="text-[10px] text-slate-500">Dev Only</div></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-card rounded-2xl overflow-hidden p-2">
        {viewMode === 'tree' ? (
          <div className="p-4 overflow-x-auto min-h-[300px]">
            {rootNodes.length > 0 ? (
              rootNodes.map((root, idx) => (
                <TreeNode key={`${root.name}@${root.version}-${idx}`} node={root} compMap={compMap} />
              ))
            ) : (
              <div className="text-center text-slate-500 py-10 text-sm">No root packages match your filters.</div>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Package</th><th>Version</th><th>Scope</th><th>Depth</th><th>PURL</th></tr>
            </thead>
            <tbody>
              {filtered.map((comp, i) => (
                <tr key={i}>
                  <td className="font-mono text-white font-medium">{comp.name}</td>
                  <td className="font-mono text-slate-400">{comp.version}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-lg ${comp.scope === 'dependency' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{comp.scope === 'dependency' ? 'prod' : 'dev'}</span></td>
                  <td className="text-slate-500 font-mono">{comp.depth}</td>
                  <td className="text-slate-600 font-mono text-xs truncate max-w-[200px]">{comp.purl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {viewMode === 'table' && filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">No packages match your search.</div>
        )}
      </div>
    </div>
  );
}
