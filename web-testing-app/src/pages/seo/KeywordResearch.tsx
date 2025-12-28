import React, { useState } from 'react';
import { generateKeywordIdeas, KeywordIdea } from '../../services/seoGemini';
import { Search, Loader2 } from 'lucide-react';

export default function KeywordResearch() {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordIdea[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seed.trim()) return;

    setLoading(true);
    try {
      const ideas = await generateKeywordIdeas(seed);
      setResults(ideas);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Keyword Research</h1>
      <p className="text-gray-500">Enter a seed keyword to generate AI-powered keyword ideas.</p>

      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="e.g. digital marketing"
          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          Generate Ideas
        </button>
      </form>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 font-medium text-gray-500">Keyword</th>
                <th className="p-4 font-medium text-gray-500">Volume</th>
                <th className="p-4 font-medium text-gray-500">Difficulty</th>
                <th className="p-4 font-medium text-gray-500">Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((idea, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{idea.keyword}</td>
                  <td className="p-4">{idea.searchVolume}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      idea.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      idea.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {idea.difficulty}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{idea.intent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
