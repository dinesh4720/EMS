import React, { useState } from 'react';
import { analyzeContentForSEO, ContentAnalysis } from '@/services/seoGemini';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContentOptimizer() {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim() || !keyword.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeContentForSEO(content, keyword);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Content Optimizer</h1>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Primary keyword..."
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div className="flex-1 flex flex-col">
             <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content here..."
              className="flex-1 w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !content || !keyword}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <FileText />}
            Analyze Content
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6 overflow-y-auto">
          {analysis ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Analysis Results</h2>
                <div className={`text-2xl font-bold ${
                    analysis.score >= 80 ? 'text-green-600' :
                    analysis.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                    {analysis.score}/100
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                    Suggestions
                </h3>
                <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-blue-500">•</span>
                            {suggestion}
                        </li>
                    ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {kw}
                        </span>
                    ))}
                </div>
              </div>
              
               <div>
                <h3 className="font-semibold mb-2">Readability</h3>
                <p className="text-gray-700">{analysis.readability}</p>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>Enter content and keyword to get optimization suggestions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
