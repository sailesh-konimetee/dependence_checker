import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function RiskBarChart({ data }) {
  // Build risk level data per package
  const vulnPackages = data.vulnerabilities.vulnerablePackages || [];
  const suspPackages = data.similarityResults.suspicious || [];

  // Get top risky packages
  const packageRisks = {};

  for (const pkg of vulnPackages) {
    if (!packageRisks[pkg.package]) {
      packageRisks[pkg.package] = { vulns: 0, suspicious: false, critical: 0, high: 0, medium: 0, low: 0 };
    }
    packageRisks[pkg.package].vulns += pkg.vulnerabilities.length;
    for (const v of pkg.vulnerabilities) {
      const sev = v.severity.toLowerCase();
      if (sev === 'critical') packageRisks[pkg.package].critical++;
      else if (sev === 'high') packageRisks[pkg.package].high++;
      else if (sev === 'medium') packageRisks[pkg.package].medium++;
      else packageRisks[pkg.package].low++;
    }
  }

  for (const susp of suspPackages) {
    if (!packageRisks[susp.package]) {
      packageRisks[susp.package] = { vulns: 0, suspicious: true, critical: 0, high: 0, medium: 0, low: 0 };
    }
    packageRisks[susp.package].suspicious = true;
  }

  // Sort by total risk
  const sorted = Object.entries(packageRisks)
    .sort(([, a], [, b]) => {
      const scoreA = a.critical * 4 + a.high * 3 + a.medium * 2 + a.low + (a.suspicious ? 3 : 0);
      const scoreB = b.critical * 4 + b.high * 3 + b.medium * 2 + b.low + (b.suspicious ? 3 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const labels = sorted.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Critical',
        data: sorted.map(([, d]) => d.critical),
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'High',
        data: sorted.map(([, d]) => d.high),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Medium',
        data: sorted.map(([, d]) => d.medium),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Low',
        data: sorted.map(([, d]) => d.low),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(99, 102, 241, 0.05)' },
      },
      y: {
        stacked: true,
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { family: 'Inter', size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  if (sorted.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center h-[360px]">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-white font-semibold">No Risky Packages</h3>
        <p className="text-slate-500 text-sm mt-1">All packages look safe!</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
        Package Risk Levels
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
