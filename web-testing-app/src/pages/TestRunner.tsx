import React, { useState, useEffect } from 'react';
import { analyzeUrl, generateTestCases, runTestSuite, TestCase, TestResult } from '../services/testEngine';
import { explainScreen, injectHighlights } from '../services/screenExplain';

export default function TestRunner() {
  const [logs, setLogs] = useState<string[]>([]);
  const [systemSteps, setSystemSteps] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [cases, setCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);

  // Mock loading saved steps
  useEffect(() => {
      // In real app, load from DB or Context
      setSystemSteps([
          { type: 'SCREENSHOT', description: 'Initial State' },
          { type: 'MOVE', x: 100, y: 100, description: 'Move to Top Left' },
          { type: 'CLICK', button: 0, description: 'Click Top Left' }
      ]);
  }, []);

  const analyzeAndGenerate = async () => {
    if (!url) { setLogs(prev => [...prev, 'Please enter a URL']); return; }
    setLogs(prev => [...prev, `Analyzing ${url}...`]);
    try {
      const summary = await analyzeUrl(url);
      setLogs(prev => [...prev, `Page: ${summary.title} | forms:${summary.forms} inputs:${summary.inputs} links:${summary.links}`]);
      const generated = generateTestCases(summary);
      setCases(generated);
      setLogs(prev => [...prev, `Generated ${generated.length} test cases`] );
    } catch (e) {
      setLogs(prev => [...prev, 'Analyze error: ' + e]);
    }
  };

  const runGeneratedSuite = async () => {
    setLogs(prev => [...prev, "Starting SYSTEM test sequence..."]);
    
    try {
        if (cases.length === 0) { setLogs(prev => [...prev, 'No cases to run']); return; }
        const run = await runTestSuite(cases);
        setResults(run.results);
        setLogs(prev => [...prev, `Completed. Passed: ${run.summary.passed} Failed: ${run.summary.failed}`]);
        
        for (const step of systemSteps) {
            setLogs(prev => [...prev, `Executing: ${step.description || step.type}`]);
            
            switch (step.type) {
                case 'MOVE':
                    await window.system.mouseMove(step.x, step.y);
                    break;
                case 'CLICK':
                    await window.system.click(step.button || 0);
                    break;
                case 'TYPE':
                    await window.system.type(step.text);
                    break;
                case 'SCREENSHOT':
                    const res = await window.system.screenshot();
                    if (res.success) {
                        setLogs(prev => [...prev, "  > Screenshot captured"]);
                    } else {
                        setLogs(prev => [...prev, "  > Screenshot failed: " + res.error]);
                    }
                    break;
                default:
                    setLogs(prev => [...prev, `  > Unknown step type: ${step.type}`]);
            }
            
            // Small delay between steps
            await new Promise(r => setTimeout(r, 500));
        }

        setLogs(prev => [...prev, "Test Sequence Complete."]);

    } catch (e) {
        setLogs(prev => [...prev, "Error: " + e]);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">System Test Runner</h1>
      
      <div className="mb-4 space-x-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="border rounded px-3 py-2 w-96" />
        <button onClick={analyzeAndGenerate} className="bg-blue-600 text-white px-6 py-2 rounded">Analyze & Generate</button>
        <button onClick={runGeneratedSuite} className="bg-green-600 text-white px-6 py-2 rounded">Run Generated Suite</button>
        <button onClick={async()=>{ const exp = await explainScreen(); setLogs(p=>[...p, exp.summary]); }} className="bg-indigo-600 text-white px-6 py-2 rounded">Explain Screen</button>
        <button onClick={async()=>{ const r = await injectHighlights(); setLogs(p=>[...p, `Highlighted ${r.count} elements`]); }} className="bg-teal-600 text-white px-6 py-2 rounded">Highlight Actions</button>
      </div>

      <div className="grid grid-cols-2 gap-4 h-96">
          <div className="border rounded p-4 bg-white">
              <h3 className="font-semibold mb-2">Generated Test Cases</h3>
              <ul className="space-y-2">
                  {cases.map((tc, i) => (
                      <li key={i} className="bg-gray-50 p-2 rounded border text-sm">
                          <span className="font-bold text-blue-600">{tc.name}</span> - {tc.description}
                      </li>
                  ))}
              </ul>
          </div>
          <div className="bg-black text-green-400 p-4 rounded overflow-y-auto font-mono text-sm">
            {logs.map((log, i) => (
                <div key={i}>{log}</div>
            ))}
            {results.length > 0 && (
              <div className="mt-4">
                {results.map((r, i) => (
                  <div key={i}>{r.caseName}: {r.status} {r.error ? ' - ' + r.error : ''}</div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
