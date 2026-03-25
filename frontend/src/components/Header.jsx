import React from 'react';
import { HiShieldCheck, HiClock, HiArrowUpTray, HiChartBar } from 'react-icons/hi2';

export default function Header({ activeView, setActiveView, hasResults, onNewScan }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/70 border-b border-brand-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onNewScan}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center glow-indigo">
              <HiShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">
                Supply Chain Analyzer
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Secure Dependencies
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavButton
              icon={<HiArrowUpTray className="w-4 h-4" />}
              label="Scan"
              active={activeView === 'upload'}
              onClick={() => { onNewScan(); setActiveView('upload'); }}
            />
            {hasResults && (
              <NavButton
                icon={<HiChartBar className="w-4 h-4" />}
                label="Dashboard"
                active={activeView === 'dashboard'}
                onClick={() => setActiveView('dashboard')}
              />
            )}
            <NavButton
              icon={<HiClock className="w-4 h-4" />}
              label="History"
              active={activeView === 'history'}
              onClick={() => setActiveView('history')}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active
          ? 'bg-brand-500/15 text-brand-400 shadow-lg shadow-brand-500/10'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
