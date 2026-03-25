import React, { useState, useEffect } from 'react';
import { HiClock, HiShieldCheck, HiShieldExclamation } from 'react-icons/hi2';

export default function ScanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mt-16 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-800/50 flex items-center justify-center">
          <HiClock className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Scan History</h3>
        <p className="text-slate-500">Your scan history will appear here after your first analysis.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 animate-slide-up">
      <h2 className="text-xl font-bold text-white mb-6">📋 Scan History</h2>

      {history.map((scan, i) => (
        <div key={i} className="glass-card p-5 rounded-2xl flex items-center justify-between gap-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              scan.trustScore >= 80 ? 'bg-emerald-500/10' :
              scan.trustScore >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'
            }`}>
              {scan.trustScore >= 80 ? (
                <HiShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <HiShieldExclamation className={`w-6 h-6 ${
                  scan.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'
                }`} />
              )}
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">{scan.projectName}</h4>
              <p className="text-slate-500 text-xs">
                {new Date(scan.timestamp).toLocaleString()} · {scan.totalDeps} deps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center hidden sm:block">
              <div className="text-sm font-mono text-slate-400">{scan.vulnerabilities}</div>
              <div className="text-[10px] text-slate-600">Vulns</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-sm font-mono text-slate-400">{scan.suspicious}</div>
              <div className="text-[10px] text-slate-600">Suspicious</div>
            </div>
            <div className={`text-2xl font-extrabold font-mono ${
              scan.trustScore >= 80 ? 'text-emerald-400' :
              scan.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {scan.trustScore}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
