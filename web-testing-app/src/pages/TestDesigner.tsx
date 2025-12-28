import React, { useState, useEffect } from 'react';
import { generateTestCases } from '../services/gemini';
import { Play, MousePointer, Camera, Plus, Trash, Save } from 'lucide-react';

export default function TestDesigner() {
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // System Test Builder State
  const [systemSteps, setSystemSteps] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const handleShortcut = async (_: any, msg: string) => {
        if (msg === 'inspect-point') {
            if (isRecording) {
                // Get current mouse pos
                const pos = await window.system.getMousePos();
                if (pos.success) {
                    addStep({ type: 'MOVE', x: pos.x, y: pos.y, description: `Move to ${pos.x}, ${pos.y}` });
                }
            }
        }
    };
    window.ipcRenderer.on('global-shortcut', handleShortcut);
    return () => {
        // Cleanup listener if possible
    };
  }, [isRecording]);

  const addStep = (step: any) => {
      setSystemSteps(prev => [...prev, step]);
  };

  const handleGenerate = async () => {
    if (!description) return;
    setLoading(true);
    const cases = await generateTestCases(description);
    setTestCases(cases);
    setLoading(false);
  };

  const saveSystemTest = () => {
      // In a real app, save to DB
      alert("Test Saved (Mock)!");
      console.log(systemSteps);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Test Designer</h1>
      
      <div className="flex gap-4 mb-6 border-b pb-4">
          <div className="w-1/2 pr-4 border-r">
            <h2 className="font-semibold mb-2">AI Generator (Web)</h2>
            <div className="mb-4">
                <textarea 
                className="w-full border p-2 rounded h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe a web test scenario..."
                />
                <button 
                onClick={handleGenerate}
                disabled={loading}
                className="mt-2 bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                {loading ? 'Generating...' : 'Generate Test Cases'}
                </button>
            </div>
          </div>

          <div className="w-1/2 pl-4">
            <h2 className="font-semibold mb-2">System Test Builder</h2>
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                    {isRecording ? 'Recording (Ctrl+Shift+I)' : 'Record Steps'}
                </button>
                <button onClick={() => addStep({ type: 'CLICK', button: 0, description: 'Left Click' })} className="bg-blue-100 p-2 rounded" title="Add Click"><MousePointer size={18}/></button>
                <button onClick={() => addStep({ type: 'SCREENSHOT', description: 'Capture Screen' })} className="bg-blue-100 p-2 rounded" title="Add Screenshot"><Camera size={18}/></button>
                <button onClick={saveSystemTest} className="bg-green-600 text-white px-4 py-2 rounded ml-auto flex items-center gap-2"><Save size={18}/> Save</button>
            </div>

            <div className="bg-gray-50 border rounded h-64 overflow-y-auto p-2 space-y-2">
                {systemSteps.length === 0 && <p className="text-gray-400 text-center mt-10">No steps yet. Start recording or add manually.</p>}
                {systemSteps.map((step, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border flex justify-between items-center">
                        <span className="font-mono text-sm">
                            <span className="font-bold text-blue-600">{step.type}</span> 
                            {step.x !== undefined && ` ${step.x},${step.y}`}
                        </span>
                        <button onClick={() => setSystemSteps(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash size={14}/></button>
                    </div>
                ))}
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">Generated / Saved Tests</h2>
        {testCases.map((tc, idx) => (
          <div key={idx} className="border p-4 rounded bg-gray-50 mb-4">
            <h3 className="font-bold">{tc.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{tc.description}</p>
            <div className="text-xs bg-white p-2 border rounded">
                <pre>{JSON.stringify(tc.actions, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
