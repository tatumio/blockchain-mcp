import {
  validateChainName,
  formatApiResponse,
  extractDataFromResponse,
  buildQueryString,
  isValidUrl,
  sanitizeErrorMessage
} from './test-utils';

describe('Utils', () => {
  describe('validateChainName', () => {
    it('should return true for valid chain names', () => {
      expect(validateChainName('ethereum-mainnet')).toBe(true);
      expect(validateChainName('bitcoin-mainnet')).toBe(true);
      expect(validateChainName('polygon')).toBe(true);
      expect(validateChainName('bsc-mainnet')).toBe(true);
    });

    it('should return false for invalid chain names', () => {
      expect(validateChainName('')).toBe(false);
      expect(validateChainName('ab')).toBe(false); // too short
      expect(validateChainName('a'.repeat(51))).toBe(false); // too long
      expect(validateChainName('ETHEREUM-MAINNET')).toBe(false); // uppercase
      expect(validateChainName('ethereum_mainnet')).toBe(false); // underscore
      expect(validateChainName('ethereum mainnet')).toBe(false); // space
      expect(validateChainName('ethereum-')).toBe(false); // trailing dash
      expect(validateChainName('-ethereum')).toBe(false); // leading dash
    });

    it('should return false for non-string inputs', () => {
      expect(validateChainName(null as any)).toBe(false);
      expect(validateChainName(undefined as any)).toBe(false);
      expect(validateChainName(123 as any)).toBe(false);
      expect(validateChainName({} as any)).toBe(false);
    });
  });

  describe('formatApiResponse', () => {
    it('should handle null and undefined', () => {
      expect(formatApiResponse(null)).toBe('null');
      expect(formatApiResponse(undefined)).toBe('undefined');
    });

    it('should return strings as-is', () => {
      expect(formatApiResponse('hello')).toBe('hello');
      expect(formatApiResponse('')).toBe('');
    });

    it('should stringify objects', () => {
      const obj = { key: 'value', number: 42 };
      const result = formatApiResponse(obj);
      expect(result).toBe(JSON.stringify(obj, null, 2));
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      const result = formatApiResponse(arr);
      expect(result).toBe(JSON.stringify(arr, null, 2));
    });

    it('should handle primitive types', () => {
      expect(formatApiResponse(42)).toBe('42');
      expect(formatApiResponse(true)).toBe('true');
      expect(formatApiResponse(false)).toBe('false');
    });
  });

  describe('extractDataFromResponse', () => {
    it('should extract data property when present', () => {
      const response = {
        data: { result: 'success' },
        status: 200
      };
      expect(extractDataFromResponse(response)).toEqual({ result: 'success' });
    });

    it('should return response as-is when no data property', () => {
      const response = { result: 'success' };
      expect(extractDataFromResponse(response)).toBe(response);
    });

    it('should handle non-object inputs', () => {
      expect(extractDataFromResponse('string')).toBe('string');
      expect(extractDataFromResponse(42)).toBe(42);
      expect(extractDataFromResponse(null)).toBe(null);
      expect(extractDataFromResponse(undefined)).toBe(undefined);
    });

    it('should handle nested data structures', () => {
      const response = {
        data: {
          items: [{ id: 1 }, { id: 2 }],
          total: 2
        }
      };
      expect(extractDataFromResponse(response)).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        total: 2
      });
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from parameters', () => {
      const params = {
        page: 1,
        limit: 10,
        search: 'test'
      };
      const result = buildQueryString(params);
      expect(result).toBe('?page=1&limit=10&search=test');
    });

    it('should handle empty parameters', () => {
      expect(buildQueryString({})).toBe('');
    });

    it('should skip null and undefined values', () => {
      const params = {
        page: 1,
        limit: null,
        search: undefined,
        active: true
      };
      const result = buildQueryString(params);
      expect(result).toBe('?page=1&active=true');
    });

    it('should encode special characters', () => {
      const params = {
        query: 'hello world',
        special: 'a&b=c'
      };
      const result = buildQueryString(params);
      expect(result).toBe('?query=hello%20world&special=a%26b%3Dc');
    });

    it('should handle zero values', () => {
      const params = {
        page: 0,
        count: 0
      };
      const result = buildQueryString(params);
      expect(result).toBe('?page=0&count=0');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://api.tatum.io/v4/data')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('://example.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidUrl('https://')).toBe(false);
      expect(isValidUrl('https://.')).toBe(true); // URL constructor accepts this
      expect(isValidUrl('file:///path/to/file')).toBe(true); // file protocol URL
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should return string errors as-is', () => {
      expect(sanitizeErrorMessage('Error message')).toBe('Error message');
      expect(sanitizeErrorMessage('')).toBe('');
    });

    it('should extract message from error objects', () => {
      const error = new Error('Test error');
      expect(sanitizeErrorMessage(error)).toBe('Test error');
    });

    it('should extract error property from objects', () => {
      const errorObj = { error: 'Custom error' };
      expect(sanitizeErrorMessage(errorObj)).toBe('Custom error');
    });

    it('should prioritize message over error property', () => {
      const errorObj = {
        message: 'Primary message',
        error: 'Secondary error'
      };
      expect(sanitizeErrorMessage(errorObj)).toBe('Primary message');
    });

    it('should handle unknown error types', () => {
      expect(sanitizeErrorMessage(null)).toBe('Unknown error occurred');
      expect(sanitizeErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(sanitizeErrorMessage(42)).toBe('Unknown error occurred');
      expect(sanitizeErrorMessage({})).toBe('Unknown error occurred');
    });

    it('should handle nested error structures', () => {
      const complexError = {
        response: {
          data: {
            message: 'API error'
          }
        }
      };
      expect(sanitizeErrorMessage(complexError)).toBe('Unknown error occurred');
    });
  });
});