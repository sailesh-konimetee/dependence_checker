import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiArrowUpTray, HiDocumentText, HiCodeBracket, HiSparkles } from 'react-icons/hi2';

export default function FileUpload({ onFileScan, onJsonScan }) {
  const [mode, setMode] = useState('upload'); // upload | paste
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileScan(file);
    }
  }, [onFileScan]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
    multiple: false,
  });

  const handlePasteScan = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.dependencies && !parsed.devDependencies) {
        alert('Invalid package.json: must contain "dependencies" or "devDependencies"');
        return;
      }
      onJsonScan(parsed);
    } catch {
      alert('Invalid JSON. Please paste valid package.json content.');
    }
  };

  const loadSample = () => {
    const sample = {
      name: "sample-vulnerable-project",
      version: "1.0.0",
      dependencies: {
        "express": "4.17.1",
        "lodash": "4.17.20",
        "axios": "0.21.1",
        "jsonwebtoken": "8.5.1",
        "mongoose": "5.11.15",
        "node-fetch": "2.6.1",
        "minimist": "1.2.5",
        "tar": "4.4.13",
        "glob-parent": "5.1.1",
        "nth-check": "1.0.2",
        "qs": "6.5.2",
        "shell-quote": "1.7.2"
      },
      devDependencies: {
        "jest": "27.0.0",
        "eslint": "7.32.0",
        "nodemon": "2.0.12"
      }
    };
    setJsonText(JSON.stringify(sample, null, 2));
    setMode('paste');
  };

  return (
    <div className="mt-16 animate-slide-up">
      {/* Hero section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
          <HiSparkles className="w-4 h-4" />
          Powered by OSV.dev & Levenshtein Analysis
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Analyze Your{' '}
          <span className="gradient-text">Supply Chain</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Upload your <code className="font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">package.json</code> to detect 
          vulnerabilities, typosquatting attacks, and get a comprehensive trust score.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'upload'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
              : 'bg-surface-800/50 text-slate-400 hover:text-white hover:bg-surface-700/50'
          }`}
        >
          <HiArrowUpTray className="w-4 h-4" />
          Upload File
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === 'paste'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
              : 'bg-surface-800/50 text-slate-400 hover:text-white hover:bg-surface-700/50'
          }`}
        >
          <HiCodeBracket className="w-4 h-4" />
          Paste JSON
        </button>
      </div>

      {/* Upload zone */}
      {mode === 'upload' && (
        <div className="max-w-2xl mx-auto">
          <div
            {...getRootProps()}
            className={`upload-zone rounded-2xl p-12 text-center ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center">
              <HiDocumentText className={`w-10 h-10 ${isDragActive ? 'text-brand-400 animate-bounce' : 'text-brand-500/60'}`} />
            </div>
            {isDragActive ? (
              <p className="text-brand-400 text-lg font-semibold">Drop your package.json here...</p>
            ) : (
              <>
                <p className="text-white text-lg font-semibold mb-2">
                  Drag & drop your package.json
                </p>
                <p className="text-slate-500 text-sm">
                  or click to browse files
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Paste zone */}
      {mode === 'paste' && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Paste your package.json content here...'
              className="w-full h-64 bg-surface-900/80 rounded-xl p-4 font-mono text-sm text-slate-300 placeholder-slate-600 border border-slate-700/50 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30 resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={loadSample}
                className="text-sm text-slate-500 hover:text-brand-400 transition-colors font-medium"
              >
                Load sample data →
              </button>
              <button
                onClick={handlePasteScan}
                disabled={!jsonText.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-brand-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25"
              >
                Analyze Dependencies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '🛡️', title: 'Vulnerability Scan', desc: 'Check against OSV.dev database for known CVEs' },
          { icon: '🔍', title: 'Typosquatting Detection', desc: 'Levenshtein distance analysis for suspicious packages' },
          { icon: '📊', title: 'Trust Score', desc: 'Comprehensive 0-100 score with risk assessment' },
        ].map((feature, i) => (
          <div key={i} className="glass-card p-5 rounded-xl text-center group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{feature.icon}</div>
            <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
            <p className="text-slate-500 text-xs">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
