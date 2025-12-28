import React from 'react';

export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="mb-4">
        <label className="block mb-2">Gemini API Key</label>
        <input 
            type="password" 
            value="****************" 
            disabled 
            className="border p-2 rounded bg-gray-100 w-full max-w-md" 
        />
        <p className="text-xs text-gray-500 mt-1">Configured in .env</p>
      </div>
    </div>
  );
}
