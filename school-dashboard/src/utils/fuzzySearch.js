/**
 * Fuzzy Search Utility for Messages
 * Implements character-level matching for better search results
 */
import React from 'react';

/**
 * Calculate similarity score between two strings
 * Uses a simple character matching algorithm
 */
export function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Direct substring match gets high base score
  if (s1.includes(s2)) {
    return 0.8 + 0.2 * (s2.length / s1.length);
  }
  if (s2.includes(s1)) {
    return 0.8 + 0.2 * (s1.length / s2.length);
  }

  // Subsequence matching: find query chars in text in order,
  // tracking contiguity for better ranking
  const query = s2.length <= s1.length ? s2 : s1;
  const text = s2.length <= s1.length ? s1 : s2;

  let matchCount = 0;
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  let textIndex = 0;
  let lastMatchIndex = -2;

  for (let i = 0; i < query.length && textIndex < text.length; ) {
    if (query[i] === text[textIndex]) {
      matchCount++;
      if (textIndex === lastMatchIndex + 1) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 1;
        maxConsecutive = Math.max(maxConsecutive, 1);
      }
      lastMatchIndex = textIndex;
      i++;
    }
    textIndex++;
  }

  if (matchCount === 0) return 0.0;

  // Coverage: fraction of query characters matched
  const coverage = matchCount / query.length;
  // Contiguity: reward consecutive character runs
  const contiguity = maxConsecutive / query.length;
  // Length ratio: penalize large length differences mildly
  const lengthRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);

  const score = coverage * 0.5 + contiguity * 0.3 + lengthRatio * 0.2;

  return Math.max(0, Math.min(1, score));
}

/**
 * Check if query matches text using fuzzy matching
 * @param {string} text - The text to search in
 * @param {string} query - The search query
 * @param {number} threshold - Minimum similarity score (0-1)
 * @returns {boolean} - True if match found
 */
export function fuzzyMatch(text, query, threshold = 0.5) {
  if (!text || !query) return false;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Direct substring match (highest priority)
  if (textLower.includes(queryLower)) return true;

  // Fuzzy match using character sequence
  let queryIndex = 0;
  let textIndex = 0;
  let matchCount = 0;

  while (queryIndex < queryLower.length && textIndex < textLower.length) {
    if (queryLower[queryIndex] === textLower[textIndex]) {
      matchCount++;
      queryIndex++;
    }
    textIndex++;
  }

  // Calculate score
  const score = matchCount / queryLower.length;
  return score >= threshold;
}

/**
 * Search messages with fuzzy matching
 * @param {Array} messages - Array of message objects
 * @param {string} query - Search query
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Array} - Filtered and sorted messages
 */
export function searchMessages(messages, query, threshold = 0.5) {
  if (!query || query.trim() === '') return [];

  const queryLower = query.toLowerCase().trim();

  return messages
    .map(msg => {
      const contentMatch = fuzzyMatch(msg.content || '', queryLower, threshold);
      const nameMatch = msg.senderId?.name
        ? fuzzyMatch(msg.senderId.name, queryLower, threshold)
        : false;

      // Calculate score for sorting
      const contentScore = calculateSimilarity(msg.content || '', queryLower);
      const nameScore = msg.senderId?.name
        ? calculateSimilarity(msg.senderId.name, queryLower)
        : 0;

      const maxScore = Math.max(contentScore, nameScore);

      return {
        ...msg,
        matched: contentMatch || nameMatch,
        matchScore: maxScore,
        matchType: contentScore > nameScore ? 'content' : 'name'
      };
    })
    .filter(msg => msg.matched)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Highlight search matches in text
 * @param {string} text - Original text
 * @param {string} query - Search query
 * @returns {Array|string} - Array of React elements with matches wrapped in <mark>, or original string if no match
 */
export function highlightMatches(text, query) {
  if (!text || !query) return text;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);

  // No match found — return original string (avoids unnecessary array wrapping)
  if (parts.length === 1) return text;

  // Odd indices are the captured match groups; even indices are surrounding text.
  // React escapes text nodes automatically, so no manual HTML escaping is needed.
  return parts.map((part, i) =>
    i % 2 === 1
      ? React.createElement('mark', { key: i, className: 'bg-primary-100 text-primary rounded px-0.5' }, part)
      : part
  );
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Advanced fuzzy search with typo tolerance
 * @param {string} text - Text to search in
 * @param {string} query - Search query (may have typos)
 * @param {number} maxTypos - Maximum number of typos allowed
 * @returns {boolean} - True if match found with typos
 */
export function fuzzyMatchWithTypos(text, query, maxTypos = 2) {
  if (!text || !query) return false;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Direct match
  if (textLower.includes(queryLower)) return true;

  // Levenshtein distance for typo tolerance
  const distance = levenshteinDistance(textLower, queryLower);
  return distance <= maxTypos;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  // Create distance matrix
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Get search suggestions based on partial match
 * @param {Array} messages - Array of messages
 * @param {string} partialQuery - Partial query
 * @param {number} limit - Max suggestions
 * @returns {Array} - Array of suggestions
 */
export function getSearchSuggestions(messages, partialQuery, limit = 5) {
  if (!partialQuery || partialQuery.length < 2) return [];

  const suggestions = new Set();

  messages.forEach(msg => {
    const words = (msg.content || '').split(/\s+/);

    words.forEach(word => {
      if (word.toLowerCase().startsWith(partialQuery.toLowerCase()) && word.length > 2) {
        suggestions.add(word);
      }
    });

    // Add sender names
    if (msg.senderId?.name) {
      if (msg.senderId.name.toLowerCase().startsWith(partialQuery.toLowerCase())) {
        suggestions.add(msg.senderId.name);
      }
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

export default {
  fuzzyMatch,
  searchMessages,
  highlightMatches,
  fuzzyMatchWithTypos,
  calculateSimilarity,
  getSearchSuggestions
};
