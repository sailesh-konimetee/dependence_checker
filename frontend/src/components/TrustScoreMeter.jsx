import React, { useEffect, useState } from 'react';
import { HiXMark, HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2';

const Meter = ({ title, score, type, deductionsLabel, deductionsValue, onClick }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return { stroke: '#10b981', glow: 'glow-green', text: 'text-emerald-400' };
    if (score >= 50) return { stroke: '#f59e0b', glow: 'glow-yellow', text: 'text-amber-400' };
    return { stroke: '#ef4444', glow: 'glow-red', text: 'text-red-400' };
  };

  const colors = getColor();

  let riskText = '🚨 High Risk';
  if (score >= 80) riskText = '✅ Safe';
  else if (score >= 50) riskText = '⚠️ Moderate Risk';

  return (
    <div 
      onClick={onClick}
      className={`glass-card p-6 rounded-2xl w-full flex flex-col items-center ${colors.glow} ${onClick ? 'cursor-pointer hover:border-brand-500/50 transition-all shadow-lg hover:shadow-brand-500/20' : ''}`}
    >
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
        {title}
        {onClick && <span className="block text-[10px] text-brand-400 mt-1 lowercase font-normal">(Click to view packages)</span>}
      </h3>
      
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={colors.stroke} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="score-circle transition-all duration-100"
            style={{ filter: `drop-shadow(0 0 8px ${colors.stroke}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold ${colors.text}`}>{animatedScore}</span>
          <span className="text-slate-500 text-[10px] font-medium">/100</span>
        </div>
      </div>

      <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
        score >= 80 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
        score >= 50 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
        'bg-red-500/15 text-red-400 border border-red-500/20'
      }`}>
        {riskText}
      </div>

      <div className="w-full flex justify-between text-xs mt-auto pt-4 border-t border-slate-700/50">
        <span className="text-slate-500">{deductionsLabel}</span>
        <span className="text-red-400 font-mono">-{deductionsValue}</span>
      </div>
    </div>
  );
};

export default function TrustScoreMeter({ trustScore, sbom, similarityResults }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group packages for the modal
  const suspiciousSet = new Set();
  const suspiciousList = [];

  if (similarityResults && similarityResults.suspicious) {
    similarityResults.suspicious.forEach(item => {
      if (!suspiciousSet.has(item.package)) {
        suspiciousSet.add(item.package);
        suspiciousList.push(item);
      }
    });
  }

  const safePackagesList = [];
  if (sbom && sbom.components) {
    sbom.components.forEach(comp => {
      // Check both the name itself, or if a specific string representation matches
      if (!suspiciousSet.has(comp.name)) {
        safePackagesList.push(comp.name);
      }
    });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 h-full">
        <Meter 
          title="Integrity (Code & Fakes)" 
          score={trustScore.score} 
          type="integrity"
          deductionsLabel="Integrity deductions"
          deductionsValue={trustScore.breakdown.suspiciousDeductions}
          onClick={() => setIsModalOpen(true)}
        />
        <Meter 
          title="Vulnerability (CVEs)" 
          score={trustScore.vulnerabilityScore} 
          type="vulnerability"
          deductionsLabel="CVE deductions"
          deductionsValue={trustScore.breakdown.vulnerabilityDeductions}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
          <div className="glass-card max-w-5xl w-full max-h-[85vh] flex flex-col bg-surface-900 border border-slate-700 rounded-2xl shadow-2xl relative animate-slide-up overflow-hidden">
            
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-surface-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiCheckCircle className="text-brand-400 w-5 h-5" /> 
                Package Integrity Breakdown
              </h2>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }} 
                className="text-slate-400 hover:text-white transition cursor-pointer z-50 relative p-2"
              >
                <HiXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-[65vh]">
              
              {/* Suspicious Packages Section */}
              <div className="flex flex-col h-full overflow-hidden">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center justify-between shrink-0">
                  <span>Suspicious Packages ({suspiciousList.length})</span>
                  <HiExclamationTriangle className="w-4 h-4" />
                </h3>
                <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 pb-4">
                  {suspiciousList.length === 0 ? (
                    <p className="text-slate-500 text-sm italic bg-surface-800/50 p-3 rounded-lg border border-slate-700/50">No suspicious packages found.</p>
                  ) : (
                    <div className="space-y-2">
                      {suspiciousList.map((susp, idx) => (
                        <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex justify-between items-start">
                          <div>
                            <p className="text-red-300 font-medium text-sm">{susp.package}</p>
                            <p className="text-red-400/80 text-xs mt-1">{susp.reason}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 uppercase">
                            {susp.riskLevel || 'SUSPICIOUS'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Safe Packages Section */}
              <div className="flex flex-col h-full overflow-hidden md:border-l border-slate-700/50 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center justify-between shrink-0">
                  <span>Integrity Packages ({safePackagesList.length})</span>
                  <HiCheckCircle className="w-4 h-4" />
                </h3>
                <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 pb-4">
                  {safePackagesList.length === 0 ? (
                    <p className="text-slate-500 text-sm italic bg-surface-800/50 p-3 rounded-lg border border-slate-700/50">No pure safe dependencies found.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {safePackagesList.map((pkg, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                          {pkg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
