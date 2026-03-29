import { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ChatSearch({ messages = [], onResultClick }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Search messages with fuzzy matching
  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      setCurrentIndex(-1);
      return;
    }

    const searchLower = searchQuery.toLowerCase();

    // Fuzzy search - match characters in sequence
    const fuzzyMatch = (text, query) => {
      const textLower = text.toLowerCase();
      let queryIndex = 0;
      let textIndex = 0;

      while (queryIndex < query.length && textIndex < text.length) {
        if (query[queryIndex] === textLower[textIndex]) {
          queryIndex++;
        }
        textIndex++;
      }

      return queryIndex === query.length;
    };

    // Search in messages
    const found = messages.filter(msg => {
      return (
        fuzzyMatch(msg.content, searchLower) ||
        msg.content.toLowerCase().includes(searchLower)
      );
    });

    setResults(found.slice(0, 20)); // Limit to 20 results
    setCurrentIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && currentIndex >= 0) {
      e.preventDefault();
      onResultClick(results[currentIndex].id);
    }
  };

  // Returns an array of React elements with matched parts highlighted.
  // split() with a capturing group produces alternating [unmatched, matched, unmatched, ...]
  const buildHighlightParts = (text, query) => {
    if (!query) return [text];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      i % 2 === 1
        ? <mark key={i} className="bg-primary-100 dark:bg-primary/20 text-primary rounded px-0.5">{part}</mark>
        : part
    );
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setCurrentIndex(-1);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-default-100 rounded-lg">
        <Search size={18} className="text-default-400 flex-shrink-0" />
        <input
          type="text"
          placeholder={t('pages.searchMessages')}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-default-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-default-200 text-default-500 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {results.length > 0 && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-default-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-default-500 border-b border-default-200 bg-default-50 rounded-t-lg">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>

          {results.map((msg, index) => (
            <div
              key={msg._id}
              onClick={() => onResultClick(msg._id)}
              className={`px-3 py-2 border-b border-default-100 last:border-b-0 cursor-pointer transition-colors ${
                index === currentIndex ? 'bg-primary-10' : 'hover:bg-default-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {msg.senderId?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-default-700">
                      {msg.senderId?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-default-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-default-600 line-clamp-2">
                    {buildHighlightParts(msg.content, query)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Help */}
          <div className="px-3 py-2 text-xs text-default-500 border-t border-default-200 bg-default-50 rounded-b-lg flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>{currentIndex + 1} / {results.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
