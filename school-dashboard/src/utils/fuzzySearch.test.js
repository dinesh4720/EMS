import { describe, it, expect } from 'vitest';
import {
  calculateSimilarity, fuzzyMatch, searchMessages,
  highlightMatches, fuzzyMatchWithTypos, getSearchSuggestions,
} from './fuzzySearch';

describe('calculateSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('returns 0.0 for empty string', () => {
    expect(calculateSimilarity('', 'hello')).toBe(0.0);
    expect(calculateSimilarity('hello', '')).toBe(0.0);
  });

  it('returns positive score for partial match', () => {
    expect(calculateSimilarity('hello world', 'hello')).toBeGreaterThan(0);
  });

  it('returns score between 0 and 1', () => {
    const score = calculateSimilarity('alice', 'alice johnson');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('is case insensitive', () => {
    expect(calculateSimilarity('Hello', 'hello')).toBe(1.0);
  });
});

describe('fuzzyMatch', () => {
  it('returns false for null text', () => {
    expect(fuzzyMatch(null, 'hello')).toBe(false);
  });

  it('returns false for null query', () => {
    expect(fuzzyMatch('hello', null)).toBe(false);
  });

  it('returns true for exact substring match', () => {
    expect(fuzzyMatch('Alice Johnson', 'Alice')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(fuzzyMatch('ALICE', 'alice')).toBe(true);
  });

  it('returns true for fuzzy match above threshold', () => {
    expect(fuzzyMatch('mathematics', 'math', 0.5)).toBe(true);
  });

  it('returns false for very low similarity', () => {
    expect(fuzzyMatch('xyz', 'abc', 0.9)).toBe(false);
  });
});

describe('searchMessages', () => {
  const msgs = [
    { _id: '1', content: 'Hello World', senderId: { name: 'Alice' } },
    { _id: '2', content: 'Good Morning', senderId: { name: 'Bob' } },
    { _id: '3', content: 'Fee payment due', senderId: { name: 'Admin' } },
  ];

  it('returns empty array for empty query', () => {
    expect(searchMessages(msgs, '')).toEqual([]);
  });

  it('returns empty array for null query', () => {
    expect(searchMessages(msgs, null)).toEqual([]);
  });

  it('finds messages by content', () => {
    const results = searchMessages(msgs, 'Hello World');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toBe('Hello World');
  });

  it('sorts by score descending', () => {
    const results = searchMessages(msgs, 'Hello');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(results[i].matchScore);
    }
  });
});

describe('highlightMatches', () => {
  it('returns text unchanged for null query', () => {
    expect(highlightMatches('hello', null)).toBe('hello');
  });

  it('wraps match in mark tag', () => {
    const result = highlightMatches('Hello World', 'World');
    expect(Array.isArray(result)).toBe(true);
    const markEl = result.find(el => el && typeof el === 'object' && el.type === 'mark');
    expect(markEl).toBeTruthy();
    expect(markEl.props.children).toBe('World');
  });

  it('is case insensitive', () => {
    const result = highlightMatches('Hello World', 'world');
    expect(Array.isArray(result)).toBe(true);
    expect(result.some(el => el && typeof el === 'object' && el.type === 'mark')).toBe(true);
  });
});

describe('fuzzyMatchWithTypos', () => {
  it('returns false for null text', () => {
    expect(fuzzyMatchWithTypos(null, 'hello')).toBe(false);
  });

  it('matches exact strings', () => {
    expect(fuzzyMatchWithTypos('hello', 'hello')).toBe(true);
  });

  it('matches with 1 typo', () => {
    expect(fuzzyMatchWithTypos('helo', 'hello', 2)).toBe(true);
  });

  it('does not match very different strings', () => {
    expect(fuzzyMatchWithTypos('xyz', 'hello', 1)).toBe(false);
  });
});

describe('getSearchSuggestions', () => {
  const msgs = [
    { content: 'Mathematics homework due today', senderId: { name: 'Alice' } },
    { content: 'Math test next week', senderId: { name: 'Bob' } },
  ];

  it('returns empty array for short queries', () => {
    expect(getSearchSuggestions(msgs, 'a')).toEqual([]);
  });

  it('returns suggestions matching partial query', () => {
    const suggestions = getSearchSuggestions(msgs, 'mat');
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach((s) => {
      expect(s.toLowerCase()).toContain('mat');
    });
  });

  it('respects limit', () => {
    const suggestions = getSearchSuggestions(msgs, 'a', 5, 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });
});
