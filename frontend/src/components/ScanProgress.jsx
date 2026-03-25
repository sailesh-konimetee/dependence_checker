import React from 'react';
import { HiShieldCheck } from 'react-icons/hi2';

export default function ScanProgress({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      {/* Scanning animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center scan-pulse">
          <HiShieldCheck className="w-12 h-12 text-brand-400 animate-pulse" />
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-3 h-3 bg-brand-500 rounded-full absolute -top-1 left-1/2 -translate-x-1/2" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
          <div className="w-2 h-2 bg-purple-500 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">Scanning Dependencies</h3>
      <p className="text-slate-400 text-sm">{message || 'Analyzing your supply chain...'}</p>

      {/* Progress steps */}
      <div className="mt-8 space-y-3 text-left">
        {[
          'Parsing package.json',
          'Generating SBOM',
          'Querying OSV.dev database',
          'Running typosquatting analysis',
          'Computing trust score',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm animate-fade-in" style={{ animationDelay: `${i * 0.3}s` }}>
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-slate-500">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
