import React from 'react';
import { HiArrowDownTray, HiDocumentText, HiCodeBracket } from 'react-icons/hi2';

export default function ReportDownload({ report, data }) {
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-report-${report.reportId.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSBOM = () => {
    const blob = new Blob([JSON.stringify(data.sbom, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sbom-${data.projectName || 'project'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHTMLReport = () => {
    const html = generateHTMLReport(report, data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-report-${report.reportId.substring(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Report summary card */}
      <div className="glass-card p-8 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-6">📄 Report Summary</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Report ID" value={report.reportId.substring(0, 12) + '...'} mono />
            <InfoRow label="Generated" value={new Date(report.generatedAt).toLocaleString()} />
            <InfoRow label="Project" value={report.summary.projectName} />
            <InfoRow label="Scan Duration" value={data.scanDuration} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Trust Score" value={`${report.summary.trustScore}/100`} color={
              report.summary.trustScore >= 80 ? 'text-emerald-400' :
              report.summary.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'
            } />
            <InfoRow label="Risk Level" value={report.summary.riskLevel} />
            <InfoRow label="Total Dependencies" value={report.summary.totalDependencies} />
            <InfoRow label="Vulnerabilities" value={report.summary.totalVulnerabilities} color={
              report.summary.totalVulnerabilities > 0 ? 'text-red-400' : 'text-emerald-400'
            } />
          </div>
        </div>
      </div>

      {/* Download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DownloadCard
          icon={<HiDocumentText className="w-8 h-8" />}
          title="Full Report"
          desc="Complete analysis with all findings"
          format="HTML"
          onClick={downloadHTMLReport}
          color="brand"
        />
        <DownloadCard
          icon={<HiCodeBracket className="w-8 h-8" />}
          title="JSON Report"
          desc="Machine-readable format"
          format="JSON"
          onClick={downloadJSON}
          color="purple"
        />
        <DownloadCard
          icon={<HiDocumentText className="w-8 h-8" />}
          title="SBOM Export"
          desc="Software Bill of Materials"
          format="JSON"
          onClick={downloadSBOM}
          color="cyan"
        />
      </div>

      {/* Report preview */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Report Preview (JSON)</h3>
        <pre className="bg-surface-900/80 rounded-xl p-4 overflow-x-auto text-xs text-slate-400 font-mono max-h-96 overflow-y-auto">
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${color || 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function DownloadCard({ icon, title, desc, format, onClick, color }) {
  const colors = {
    brand: 'from-brand-500/20 to-brand-600/10 border-brand-500/20 hover:border-brand-500/40',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 hover:border-purple-500/40',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 hover:border-cyan-500/40',
  };

  const iconColors = {
    brand: 'text-brand-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
  };

  return (
    <button
      onClick={onClick}
      className={`glass-card p-6 rounded-2xl border bg-gradient-to-br ${colors[color]} text-left group hover:scale-[1.02] transition-all duration-200`}
    >
      <div className={`${iconColors[color]} mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
      <p className="text-slate-500 text-xs mb-3">{desc}</p>
      <div className="flex items-center gap-2 text-xs font-medium text-brand-400">
        <HiArrowDownTray className="w-3 h-3" />
        Download {format}
      </div>
    </button>
  );
}

function generateHTMLReport(report, data) {
  const scoreColor = report.summary.trustScore >= 80 ? '#10b981' :
    report.summary.trustScore >= 50 ? '#f59e0b' : '#ef4444';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Supply Chain Analysis Report - ${report.summary.projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; background: linear-gradient(135deg, #818cf8, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h2 { font-size: 20px; margin: 32px 0 16px; color: #a5b4fc; }
    h3 { font-size: 16px; margin: 16px 0 8px; color: #94a3b8; }
    .card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .score { text-align: center; padding: 40px; }
    .score-value { font-size: 72px; font-weight: 800; color: ${scoreColor}; }
    .score-label { font-size: 14px; color: #94a3b8; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .stat { padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: white; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid rgba(99, 102, 241, 0.15); }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid rgba(30, 41, 59, 0.5); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-critical { background: rgba(220, 38, 38, 0.2); color: #fca5a5; }
    .badge-high { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .badge-medium { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
    .badge-low { background: rgba(34, 197, 94, 0.2); color: #86efac; }
    .rec { padding: 12px 16px; background: rgba(30, 41, 59, 0.5); border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(99, 102, 241, 0.1); color: #475569; font-size: 12px; }
    code { font-family: 'Consolas', monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ Supply Chain Analysis Report</h1>
    <p style="color: #64748b; margin-bottom: 32px;">Generated: ${new Date(report.generatedAt).toLocaleString()} | Report ID: ${report.reportId.substring(0, 12)}</p>

    <div class="card score">
      <div class="score-value">${report.summary.trustScore}</div>
      <div class="score-label">Trust Score / 100 — ${report.summary.riskLevel}</div>
    </div>

    <div class="grid">
      <div class="card stat"><div class="stat-value">${report.summary.totalDependencies}</div><div class="stat-label">Total Dependencies</div></div>
      <div class="card stat"><div class="stat-value">${report.summary.totalVulnerabilities}</div><div class="stat-label">Vulnerabilities</div></div>
      <div class="card stat"><div class="stat-value">${report.summary.suspiciousPackages}</div><div class="stat-label">Suspicious Packages</div></div>
      <div class="card stat"><div class="stat-value">${data.scanDuration}</div><div class="stat-label">Scan Duration</div></div>
    </div>

    <h2>🔍 Vulnerable Packages</h2>
    <div class="card">
      ${report.vulnerabilities.vulnerablePackages.length === 0 ? '<p style="color: #10b981;">✅ No vulnerabilities found!</p>' :
        `<table>
          <thead><tr><th>Package</th><th>Version</th><th>Vulnerability</th><th>Severity</th></tr></thead>
          <tbody>
            ${report.vulnerabilities.vulnerablePackages.map(pkg => 
              pkg.vulnerabilities.map(v => 
                `<tr><td><code>${pkg.package}</code></td><td>${pkg.version}</td><td>${v.id}: ${v.summary.substring(0, 80)}</td><td><span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span></td></tr>`
              ).join('')
            ).join('')}
          </tbody>
        </table>`
      }
    </div>

    ${report.suspiciousPackages.suspicious.length > 0 ? `
    <h2>⚠️ Suspicious Packages</h2>
    <div class="card">
      <table>
        <thead><tr><th>Package</th><th>Risk</th><th>Similar To</th><th>Reason</th></tr></thead>
        <tbody>
          ${report.suspiciousPackages.suspicious.map(s => 
            `<tr><td><code>${s.package}</code></td><td>${s.riskLevel}</td><td>${s.closestMatch?.similarTo || 'N/A'}</td><td>${s.reason.substring(0, 100)}</td></tr>`
          ).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <h2>📋 Recommendations</h2>
    <div class="card">
      ${report.recommendations.map(r => `<div class="rec">${r}</div>`).join('')}
    </div>

    <div class="footer">
      <p>Supply Chain Analyzer v1.0.0 | Powered by OSV.dev</p>
    </div>
  </div>
</body>
</html>`;
}
