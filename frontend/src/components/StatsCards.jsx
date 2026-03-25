import React from 'react';
import { HiCube, HiShieldExclamation, HiExclamationTriangle, HiBolt } from 'react-icons/hi2';

export default function StatsCards({ data }) {
  const stats = [
    {
      label: 'Total Packages',
      value: data.sbom.totalComponents,
      sub: `${data.sbom.directDependencies} direct`,
      icon: <HiCube className="w-6 h-6" />,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Vulnerabilities',
      value: data.vulnerabilities.summary.total,
      sub: `${data.vulnerabilities.summary.critical} critical`,
      icon: <HiShieldExclamation className="w-6 h-6" />,
      color: data.vulnerabilities.summary.total > 0 ? 'from-red-500/20 to-red-600/10' : 'from-emerald-500/20 to-emerald-600/10',
      iconColor: data.vulnerabilities.summary.total > 0 ? 'text-red-400' : 'text-emerald-400',
      borderColor: data.vulnerabilities.summary.total > 0 ? 'border-red-500/20' : 'border-emerald-500/20',
    },
    {
      label: 'Suspicious Packages',
      value: data.similarityResults.suspiciousCount,
      sub: `${data.similarityResults.highRisk} high risk`,
      icon: <HiExclamationTriangle className="w-6 h-6" />,
      color: data.similarityResults.suspiciousCount > 0 ? 'from-amber-500/20 to-amber-600/10' : 'from-emerald-500/20 to-emerald-600/10',
      iconColor: data.similarityResults.suspiciousCount > 0 ? 'text-amber-400' : 'text-emerald-400',
      borderColor: data.similarityResults.suspiciousCount > 0 ? 'border-amber-500/20' : 'border-emerald-500/20',
    },
    {
      label: 'Scan Duration',
      value: data.scanDuration,
      sub: 'analysis time',
      icon: <HiBolt className="w-6 h-6" />,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`glass-card p-5 rounded-2xl border ${stat.borderColor} group hover:scale-[1.02] transition-transform duration-200`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stat.value}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
          <div className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}
