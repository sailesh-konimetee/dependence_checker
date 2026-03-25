import React, { useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ScanProgress from './components/ScanProgress';
import Dashboard from './components/Dashboard';
import ScanHistory from './components/ScanHistory';

const API_BASE = '/api';

function App() {
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [activeView, setActiveView] = useState('upload'); // upload | dashboard | history

  const handleFileScan = useCallback(async (file) => {
    setIsScanning(true);
    setScanProgress('Uploading package.json...');
    setScanResults(null);

    try {
      const formData = new FormData();
      formData.append('packageJson', file);

      setScanProgress('Analyzing dependencies...');
      
      const response = await fetch(`${API_BASE}/scan/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      setScanProgress('Processing results...');
      const data = await response.json();

      if (data.success) {
        setScanResults(data);
        setActiveView('dashboard');
        toast.success(`Scan complete! Trust Score: ${data.trustScore.score}/100`, {
          duration: 5000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          },
        });
      }
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(err.message || 'Failed to scan package.json', {
        style: {
          background: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, []);

  const handleJsonScan = useCallback(async (jsonData) => {
    setIsScanning(true);
    setScanProgress('Analyzing dependencies...');
    setScanResults(null);

    try {
      const response = await fetch(`${API_BASE}/scan/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      setScanProgress('Processing results...');
      const data = await response.json();

      if (data.success) {
        setScanResults(data);
        setActiveView('dashboard');
        toast.success(`Scan complete! Trust Score: ${data.trustScore.score}/100`, {
          duration: 5000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          },
        });
      }
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(err.message || 'Failed to scan dependencies', {
        style: {
          background: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        },
      });
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  }, []);

  const handleNewScan = () => {
    setScanResults(null);
    setActiveView('upload');
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated background blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Content */}
      <div className="relative z-10">
        <Toaster position="top-right" />
        
        <Header 
          activeView={activeView}
          setActiveView={setActiveView}
          hasResults={!!scanResults}
          onNewScan={handleNewScan}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {isScanning && <ScanProgress message={scanProgress} />}
          
          {activeView === 'upload' && !isScanning && (
            <FileUpload 
              onFileScan={handleFileScan}
              onJsonScan={handleJsonScan}
            />
          )}

          {activeView === 'dashboard' && scanResults && (
            <Dashboard data={scanResults} onNewScan={handleNewScan} />
          )}

          {activeView === 'history' && (
            <ScanHistory />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
