import React, { useState } from 'react';
import { HiSparkles, HiCpuChip } from 'react-icons/hi2';

export default function AIExplanation({ packageName, vulnerabilities, similarityInfo }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: packageName,
          vulnerabilities,
          similarityInfo
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.explanation || data.error || 'Failed to generate AI explanation.');
      }

      setExplanation(data.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (explanation) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-2">
          <HiSparkles className="w-5 h-5 text-indigo-400" />
          <h4 className="font-semibold text-indigo-400 text-sm">AI Impact Analysis</h4>
        </div>
        <div className="text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
          {explanation}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={fetchExplanation}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <HiCpuChip className="w-4 h-4" />
        )}
        {loading ? 'Analyzing Impact...' : 'Ask AI for Analysis'}
      </button>
      
      {error && (
        <div className="mt-2 text-xs text-red-400 p-2 rounded bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}
    </div>
  );
}
