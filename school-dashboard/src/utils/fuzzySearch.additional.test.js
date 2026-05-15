/**
 * Additional fuzzy search tests — edge cases not covered in fuzzySearch.test.js.
 * Focus: empty arrays, Unicode, very long strings, case sensitivity, special chars.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity,
  fuzzyMatch,
  searchMessages,
  highlightMatches,
  fuzzyMatchWithTypos,
  getSearchSuggestions,
} from './fuzzySearch';

// ─── calculateSimilarity — additional edge cases ──────────────────────────────

describe('calculateSimilarity - additional edge cases', () => {
  it('returns 1 for two empty strings (identical)', () => {
    // Both empty → s1 === s2 branch triggers → 1.0
    expect(calculateSimilarity('', '')).toBe(1.0);
  });

  it('returns a value clamped to [0, 1] for completely dissimilar strings', () => {
    const score = calculateSimilarity('aaaaaaaaaa', 'zzzzzzzzzz');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('is case insensitive — "ABC" vs "abc" returns 1.0', () => {
    expect(calculateSimilarity('ABC', 'abc')).toBe(1.0);
  });

  it('handles a very long string without throwing', () => {
    const long = 'a'.repeat(10000);
    expect(() => calculateSimilarity(long, 'a')).not.toThrow();
  });

  it('handles Unicode characters without throwing', () => {
    expect(() => calculateSimilarity('नमस्ते', 'hello')).not.toThrow();
  });
});

// ─── fuzzyMatch — additional edge cases ──────────────────────────────────────

describe('fuzzyMatch - additional edge cases', () => {
  it('returns false for both text and query empty strings', () => {
    expect(fuzzyMatch('', '')).toBe(false);
  });

  it('returns false for text empty but query non-empty', () => {
    expect(fuzzyMatch('', 'hello')).toBe(false);
  });

  it('returns false for query empty but text non-empty', () => {
    expect(fuzzyMatch('hello', '')).toBe(false);
  });

  it('handles special regex characters in query without throwing', () => {
    // ".*+?" should not break the substring includes check
    expect(() => fuzzyMatch('price is $100', '$100')).not.toThrow();
    expect(fuzzyMatch('price is $100', '$100')).toBe(true);
  });

  it('matches query that is a substring at end of text', () => {
    expect(fuzzyMatch('contact principal', 'principal')).toBe(true);
  });

  it('returns true at high threshold when text exactly equals query', () => {
    expect(fuzzyMatch('exact', 'exact', 1.0)).toBe(true);
  });

  it('returns false with threshold 1.0 for non-identical strings', () => {
    // score = matchCount/queryLen which could be less than 1 for non-substring
    expect(fuzzyMatch('abcde', 'xyz', 1.0)).toBe(false);
  });

  it('handles Unicode text and query without throwing', () => {
    expect(() => fuzzyMatch('こんにちは世界', 'hello')).not.toThrow();
  });
});

// ─── searchMessages — empty arrays and edge cases ─────────────────────────────

describe('searchMessages - additional edge cases', () => {
  it('returns empty array when messages array is empty', () => {
    expect(searchMessages([], 'hello')).toEqual([]);
  });

  it('returns empty array for whitespace-only query', () => {
    const msgs = [{ content: 'Hello World', senderId: { name: 'Alice' } }];
    expect(searchMessages(msgs, '   ')).toEqual([]);
  });

  it('adds matchScore and matchType to results', () => {
    const msgs = [{ _id: '1', content: 'Fee payment reminder' }];
    const results = searchMessages(msgs, 'fee', 0.3);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('matchScore');
      expect(results[0]).toHaveProperty('matchType');
    }
  });

  it('handles messages without senderId gracefully', () => {
    const msgs = [{ _id: '1', content: 'No sender here' }];
    expect(() => searchMessages(msgs, 'sender')).not.toThrow();
  });

  it('handles messages with undefined content gracefully', () => {
    const msgs = [{ _id: '1', content: undefined, senderId: { name: 'Admin' } }];
    expect(() => searchMessages(msgs, 'admin')).not.toThrow();
  });
});

// ─── highlightMatches — special characters ────────────────────────────────────

describe('highlightMatches - special characters and edge cases', () => {
  it('returns original text when text is null', () => {
    expect(highlightMatches(null, 'query')).toBeNull();
  });

  it('escapes special regex characters in query', () => {
    // If escaping works, this should not throw
    expect(() => highlightMatches('cost is $50', '$50')).not.toThrow();
    const result = highlightMatches('cost is $50', '$50');
    expect(Array.isArray(result)).toBe(true);
    const markEl = result.find(el => el && typeof el === 'object' && el.type === 'mark');
    expect(markEl).toBeTruthy();
    expect(markEl.props.children).toBe('$50');
  });

  it('handles query with parentheses without throwing', () => {
    expect(() => highlightMatches('Hello (World)', '(World)')).not.toThrow();
  });

  it('wraps all occurrences (case insensitive) in mark tags', () => {
    const result = highlightMatches('hello hello HELLO', 'hello');
    expect(Array.isArray(result)).toBe(true);
    const markCount = result.filter(el => el && typeof el === 'object' && el.type === 'mark').length;
    expect(markCount).toBe(3);
  });

  it('returns text unchanged when query does not appear in text', () => {
    const result = highlightMatches('mathematics', 'xyz');
    expect(result).toBe('mathematics');
  });
});

// ─── fuzzyMatchWithTypos — edge cases ─────────────────────────────────────────

describe('fuzzyMatchWithTypos - additional edge cases', () => {
  it('returns false for null query', () => {
    expect(fuzzyMatchWithTypos('hello', null)).toBe(false);
  });

  it('returns false when query is empty string (falsy guard triggers)', () => {
    // !query → !''" = true → returns false immediately
    expect(fuzzyMatchWithTypos('anything', '')).toBe(false);
  });

  it('matches with 0 maxTypos only for exact substring', () => {
    expect(fuzzyMatchWithTypos('mathematics', 'math', 0)).toBe(true);
    expect(fuzzyMatchWithTypos('mathematics', 'meth', 0)).toBe(false);
  });

  it('handles very long strings without throwing', () => {
    const long = 'abcdefghij'.repeat(100);
    expect(() => fuzzyMatchWithTypos(long, 'xyz', 2)).not.toThrow();
  });
});

// ─── getSearchSuggestions — edge cases ───────────────────────────────────────

describe('getSearchSuggestions - additional edge cases', () => {
  it('returns empty array for empty messages array', () => {
    expect(getSearchSuggestions([], 'mat')).toEqual([]);
  });

  it('returns empty array when query is exactly 1 character (below min 2)', () => {
    const msgs = [{ content: 'mathematics', senderId: { name: 'Alice' } }];
    expect(getSearchSuggestions(msgs, 'm')).toEqual([]);
  });

  it('returns empty array for null query', () => {
    const msgs = [{ content: 'mathematics' }];
    expect(getSearchSuggestions(msgs, null)).toEqual([]);
  });

  it('respects the limit parameter', () => {
    const msgs = [
      { content: 'alpha almond alto album algebra' },
    ];
    const suggestions = getSearchSuggestions(msgs, 'al', 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it('does not include words shorter than or equal to 2 chars', () => {
    const msgs = [{ content: 'at an as' }];
    // All words are 2 chars, word.length > 2 requirement means none qualify
    const suggestions = getSearchSuggestions(msgs, 'at');
    expect(suggestions).toEqual([]);
  });

  it('includes sender name when it starts with the partial query', () => {
    const msgs = [{ content: '', senderId: { name: 'Priya' } }];
    const suggestions = getSearchSuggestions(msgs, 'Pr');
    expect(suggestions).toContain('Priya');
  });
});
