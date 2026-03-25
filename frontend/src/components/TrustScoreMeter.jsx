import React, { useEffect, useState } from 'react';

export default function TrustScoreMeter({ trustScore }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const score = trustScore.score;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    // Animate score from 0 to actual value
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return { stroke: '#10b981', glow: 'glow-green', text: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5' };
    if (score >= 50) return { stroke: '#f59e0b', glow: 'glow-yellow', text: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5' };
    return { stroke: '#ef4444', glow: 'glow-red', text: 'text-red-400', bg: 'from-red-500/20 to-red-500/5' };
  };

  const colors = getColor();

  return (
    <div className={`glass-card p-8 rounded-2xl ${colors.glow} flex flex-col items-center`}>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trust Score</h3>
      
      {/* SVG Circle */}
      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(99, 102, 241, 0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-circle transition-all duration-100"
            style={{ filter: `drop-shadow(0 0 8px ${colors.stroke}40)` }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold ${colors.text}`}>
            {animatedScore}
          </span>
          <span className="text-slate-500 text-xs font-medium">/100</span>
        </div>
      </div>

      {/* Risk level badge */}
      <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
        score >= 80 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
        score >= 50 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
        'bg-red-500/15 text-red-400 border border-red-500/20'
      }`}>
        {trustScore.riskLevel === 'SAFE' && '✅ Safe'}
        {trustScore.riskLevel === 'MODERATE' && '⚠️ Moderate Risk'}
        {trustScore.riskLevel === 'HIGH_RISK' && '🚨 High Risk'}
      </div>

      {/* Deductions */}
      <div className="mt-6 w-full space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Vulnerability deductions</span>
          <span className="text-red-400 font-mono">-{trustScore.breakdown.vulnerabilityDeductions}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Suspicious pkg deductions</span>
          <span className="text-amber-400 font-mono">-{trustScore.breakdown.suspiciousDeductions}</span>
        </div>
      </div>
    </div>
  );
}
