/**
 * String utility functions for ticker resolution
 * - Levenshtein distance for fuzzy matching
 * - String normalization (trim, lowercase, remove punctuation)
 */

/**
 * Calculate Levenshtein distance between two strings
 * Measures the minimum number of single-character edits needed to transform one string into another
 */
export function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array.from({ length: len2 + 1 }, () => Array(len1 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }

  // Fill in the matrix
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Based on Levenshtein distance
 */
export function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLen);
}

/**
 * Normalize string for matching:
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove common punctuation and symbols
 * - Handle spaces consistently
 */
export function normalizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .toLowerCase()
    .replace(/[.,&'"\-()]/g, '') // Remove common punctuation
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/\s/g, '')          // Remove remaining spaces for matching
    .trim();
}

/**
 * Partial string matching - checks if one string contains sequences from another
 * Useful for finding "nvidia corporation" when searching for "nvidia"
 */
export function partialMatch(needle, haystack, threshold = 0.7) {
  const needleWords = needle.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const haystackWords = haystack.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  const matches = needleWords.filter(nw => 
    haystackWords.some(hw => hw.includes(nw) || nw.includes(hw))
  );

  return matches.length / needleWords.length >= threshold;
}

/**
 * Extract ticker-like patterns from string
 * Returns all potential ticker symbols found
 */
export function extractTickerPatterns(input) {
  const tickerPattern = /\b[A-Z]{1,5}(?:\.[A-Z]{1,2})?\b/g;
  return input.toUpperCase().match(tickerPattern) || [];
}

/**
 * Validate ticker symbol format
 * Tickers are 1-5 uppercase letters, optionally with a dot and suffix (e.g., BRK.B)
 */
export function isValidTickerFormat(ticker) {
  const pattern = /^[A-Z]{1,5}(?:\.[A-Z]{1,2})?$/;
  return pattern.test(ticker);
}

/**
 * Remove spaces and punctuation from string, useful for detecting
 * edge cases like "N V D A" should match "NVDA"
 */
export function stripSpacesAndPunctuation(input) {
  return input
    .toUpperCase()
    .replace(/[\s\.\-()&,'"]/g, '');
}

/**
 * Tokenize company name into words for analysis
 */
export function tokenizeCompanyName(input) {
  return input
    .toLowerCase()
    .replace(/[.,&'"\-()]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}
