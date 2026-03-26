import React, { useState } from 'react';
import { HiSparkles, HiCpuChip } from 'react-icons/hi2';

export default function AIReportExplanation({ data }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build issues string
      let issuesText = '';
      if (data.vulnerabilities.summary.total > 0) {
        issuesText += `- ${data.vulnerabilities.summary.total} vulnerabilities detected.\n`;
      }
      if (data.similarityResults.suspiciousCount > 0) {
        issuesText += `- ${data.similarityResults.suspiciousCount} suspicious packages detected.\n`;
      }
      if (issuesText === '') {
        issuesText = '- No major issues detected. All scanned components appear safe.';
      }

      const response = await fetch('/api/explain-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trustScore: data.trustScore.score,
          riskLevel: data.trustScore.riskLevel,
          issues: issuesText
        })
      });

      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.explanation || resData.error || 'Failed to generate AI explanation.');
      }

      setExplanation(resData.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedExplanation = (text) => {
    const recommendationIndex = text.indexOf('- Recommendation:');
    if (recommendationIndex !== -1) {
      const beforeRec = text.substring(0, recommendationIndex);
      const recommendationText = text.substring(recommendationIndex + '- Recommendation:'.length).trim();
      return (
        <div className="space-y-6">
          <div className="whitespace-pre-wrap">{beforeRec.trim()}</div>
          <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl">
            <h4 className="flex items-center gap-2 font-bold text-brand-400 mb-2">
              <HiSparkles className="w-4 h-4" />
              Recommendation
            </h4>
            <div className="whitespace-pre-wrap text-brand-100">{recommendationText}</div>
          </div>
        </div>
      );
    }
    return <div className="whitespace-pre-wrap">{text}</div>;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner">
          <HiSparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Comprehensive AI Analysis</h3>
        <p className="text-slate-400 max-w-lg mb-8">
          Get a professional cybersecurity assessment of your entire project dependency risk report, summarized in simple language.
        </p>
        
        {!explanation && !loading && (
          <button
            onClick={fetchExplanation}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            <HiCpuChip className="w-5 h-5" />
            Generate Full Report Analysis
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-indigo-400 font-medium tracking-wide">Analyzing overall project risk...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl max-w-lg shadow-sm">
            {error}
          </div>
        )}

        {explanation && (
          <div className="mt-4 w-full text-left text-slate-300 leading-relaxed max-w-3xl border border-indigo-500/20 bg-indigo-900/10 p-8 rounded-2xl relative shadow-sm">
            {renderFormattedExplanation(explanation)}
          </div>
        )}
      </div>
    </div>
  );
}
