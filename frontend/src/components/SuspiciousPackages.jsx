import React from 'react';
import { HiExclamationTriangle, HiMagnifyingGlass } from 'react-icons/hi2';
import AIExplanation from './AIExplanation';

export default function SuspiciousPackages({ results }) {
  const suspicious = results.suspicious || [];

  if (suspicious.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center animate-fade-in">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-white mb-2">No Suspicious Packages</h3>
        <p className="text-slate-500">No typosquatting or suspicious naming patterns detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Info banner */}
      <div className="glass-card p-4 rounded-2xl border border-amber-500/20">
        <div className="flex items-start gap-3">
          <HiMagnifyingGlass className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-400">Typosquatting Detection</h4>
            <p className="text-xs text-slate-500 mt-1">
              These packages have names very similar to popular npm packages. They could be legitimate or potential 
              typosquatting attacks. Please verify each package manually.
            </p>
          </div>
        </div>
      </div>

      {/* Suspicious packages list */}
      {suspicious.map((pkg, i) => (
        <div key={i} className={`glass-card rounded-2xl p-5 border ${
          pkg.riskLevel === 'HIGH' ? 'border-red-500/20' : 'border-amber-500/20'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                pkg.riskLevel === 'HIGH' ? 'bg-red-500/10' : 'bg-amber-500/10'
              }`}>
                <HiExclamationTriangle className={`w-5 h-5 ${
                  pkg.riskLevel === 'HIGH' ? 'text-red-400' : 'text-amber-400'
                }`} />
              </div>
              <div>
                <div className="text-white font-semibold font-mono text-sm">{pkg.package}</div>
                <div className={`text-xs font-medium ${
                  pkg.riskLevel === 'HIGH' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {pkg.riskLevel} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <p className="text-sm text-slate-400 mb-4">{pkg.reason}</p>

          {/* Similarity matches */}
          {pkg.allMatches && pkg.allMatches.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Similar packages:</h5>
              {pkg.allMatches.map((match, j) => (
                <div key={j} className="flex items-center justify-between bg-surface-900/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono text-sm">{match.similarTo}</span>
                    <span className="text-[10px] text-slate-600">popular package</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono text-brand-400">{match.similarity}%</div>
                      <div className="text-[10px] text-slate-600">similarity</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-400">d={match.distance}</div>
                      <div className="text-[10px] text-slate-600">distance</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patterns */}
          {pkg.patterns && pkg.patterns.length > 0 && (
            <div className="mt-3">
              {pkg.patterns.map((pattern, j) => (
                <div key={j} className="text-xs text-amber-400/80 bg-amber-500/5 rounded-lg p-2">
                  {pattern.detail}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-slate-700/50 pt-4">
            <AIExplanation 
              packageName={pkg.package} 
              similarityInfo={pkg} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
