import React, { useEffect, useState } from 'react';

export default function TabSelection() {
  const [tabs, setTabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTabs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Diagnostic check
      if (window.cdp.checkConnection) {
          const diag = await window.cdp.checkConnection();
          if (!diag.success) {
              console.warn("Port 9222 check failed:", diag.error);
          } else {
              console.log("Port 9222 is open, version info:", diag.data);
          }
      } else {
          console.warn("window.cdp.checkConnection is not available. You might need to reload the app.");
      }

      const result = await window.cdp.getTabs();
      if (result.error) {
          setError(result.message);
          setTabs([]);
          return;
      }
      
      if (Array.isArray(result)) {
         // Filter only page targets
        const pageTabs = result.filter((t: any) => t.type === 'page');
        setTabs(pageTabs);
      } else {
        setTabs([]);
      }
    } catch (error) {
      console.error("Failed to fetch tabs", error);
      setError("Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabs();
  }, []);

  const connectToTab = async (id: string) => {
    const res = await window.cdp.connect(id);
    if (res.success) {
      alert("Connected to tab!");
    } else {
      alert("Failed to connect: " + res.error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Select Chrome Tab</h1>
      <button 
        onClick={fetchTabs} 
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Refresh Tabs
      </button>
      
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tabs.map(tab => (
            <div key={tab.id} className="border p-4 rounded shadow bg-white">
              <h3 className="font-semibold truncate" title={tab.title}>{tab.title}</h3>
              <p className="text-sm text-gray-500 truncate" title={tab.url}>{tab.url}</p>
              <button 
                onClick={() => connectToTab(tab.id)}
                className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      )}
      
      {tabs.length === 0 && !loading && !error && (
        <p className="text-gray-500">No tabs found. Make sure Chrome is running with --remote-debugging-port=9222</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Connection Failed! </strong>
            <span className="block sm:inline">Could not connect to Chrome at port 9222.</span>
            <div className="mt-2 text-sm text-gray-700">
                <p>Please launch Chrome with remote debugging enabled:</p>
                <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs overflow-x-auto select-all">
                    {navigator.userAgent.indexOf("Win") !== -1 
                        ? '& "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222'
                        : '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222'
                    }
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
