import React from 'react';
import { Activity } from 'lucide-react';

export default function SiteAudit() {
  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
             <h1 className="text-3xl font-bold">Site Audit</h1>
             <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                 New Audit
             </button>
        </div>
     
      <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Activity className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Audits Yet</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
            Run a technical SEO audit to identify broken links, speed issues, and optimization opportunities.
        </p>
      </div>
    </div>
  );
}
