/**
 * Utility functions for the Tatum MCP server
 */

export function validateChainName(chain: string): boolean {
  if (!chain || typeof chain !== 'string') {
    return false;
  }
  
  // Basic validation for chain name format
  const chainPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return chainPattern.test(chain) && chain.length >= 3 && chain.length <= 50;
}

export function formatApiResponse(data: any): string {
  if (data === null) {
    return 'null';
  }
  
  if (data === undefined) {
    return 'undefined';
  }
  
  if (typeof data === 'string') {
    return data;
  }
  
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    // JSON.stringify can fail with circular references or non-serializable values
    console.warn('Failed to stringify data:', error instanceof Error ? error.message : 'Unknown error');
    return String(data);
  }
}

export function extractDataFromResponse(response: any): any {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  if ('data' in response) {
    return response.data;
  }
  
  return response;
}

export function buildQueryString(params: Record<string, any>): string {
  const queryParams: string[] = [];
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  
  return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    if (error.message) {
      return String(error.message);
    }
    
    if (error.error) {
      return String(error.error);
    }
  }
  
  return 'Unknown error occurred';
}