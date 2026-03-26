import React, { useState } from 'react';
import TrustScoreMeter from './TrustScoreMeter';
import StatsCards from './StatsCards';
import VulnerabilityChart from './VulnerabilityChart';
import RiskBarChart from './RiskBarChart';
import VulnerabilityTable from './VulnerabilityTable';
import SuspiciousPackages from './SuspiciousPackages';
import SBOMView from './SBOMView';
import ReportDownload from './ReportDownload';
import AIReportExplanation from './AIReportExplanation';
import { HiChartBar, HiShieldExclamation, HiExclamationTriangle, HiDocumentText, HiArrowDownTray, HiArrowPath, HiSparkles } from 'react-icons/hi2';

export default function Dashboard({ data, onNewScan }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <HiChartBar className="w-4 h-4" /> },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: <HiShieldExclamation className="w-4 h-4" /> },
    { id: 'suspicious', label: 'Suspicious', icon: <HiExclamationTriangle className="w-4 h-4" /> },
    { id: 'ai-analysis', label: 'AI Analysis', icon: <HiSparkles className="w-4 h-4" /> },
    { id: 'sbom', label: 'SBOM', icon: <HiDocumentText className="w-4 h-4" /> },
    { id: 'report', label: 'Report', icon: <HiArrowDownTray className="w-4 h-4" /> },
  ];

  return (
    <div className="mt-8 animate-slide-up">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {data.projectName}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Scanned in {data.scanDuration} · {data.sbom.totalComponents} packages analyzed
          </p>
        </div>
        <button
          onClick={onNewScan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/50 text-slate-400 hover:text-white hover:bg-surface-700/50 border border-slate-700/50 transition-all text-sm font-medium"
        >
          <HiArrowPath className="w-4 h-4" />
          New Scan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-brand-500/15 text-brand-400 shadow-lg shadow-brand-500/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'vulnerabilities' && data.vulnerabilities.summary.total > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400">
                {data.vulnerabilities.summary.total}
              </span>
            )}
            {tab.id === 'suspicious' && data.similarityResults.suspiciousCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400">
                {data.similarityResults.suspiciousCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Trust Score + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TrustScoreMeter 
                trustScore={data.trustScore} 
                sbom={data.sbom} 
                similarityResults={data.similarityResults} 
              />
            </div>
            <div className="lg:col-span-2">
              <StatsCards data={data} />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VulnerabilityChart summary={data.vulnerabilities.summary} />
            <RiskBarChart data={data} />
          </div>

          {/* Recommendations */}
          {data.trustScore.recommendation && data.trustScore.recommendation.length > 0 && (
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">📋 Recommendations</h3>
              <div className="space-y-3">
                {data.trustScore.recommendation.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300 bg-surface-800/50 rounded-xl p-4">
                    <span className="flex-shrink-0 mt-0.5">{rec.substring(0, 2)}</span>
                    <span>{rec.substring(2).trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'vulnerabilities' && (
        <VulnerabilityTable vulnerabilities={data.vulnerabilities} />
      )}

      {activeTab === 'suspicious' && (
        <SuspiciousPackages results={data.similarityResults} />
      )}

      {activeTab === 'ai-analysis' && (
        <AIReportExplanation data={data} />
      )}

      {activeTab === 'sbom' && (
        <SBOMView sbom={data.sbom} />
      )}

      {activeTab === 'report' && (
        <ReportDownload report={data.report} data={data} />
      )}
    </div>
  );
}
