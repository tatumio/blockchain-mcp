import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TatumApiResponse, ToolExecutionContext } from './types.js';
import { TatumConfig } from './config.js';

export class TatumApiClient {
  private readonly client: AxiosInstance;
  private readonly context: ToolExecutionContext;
  private readonly config: TatumConfig;

  constructor(context: ToolExecutionContext) {
    this.context = context;
    this.config = TatumConfig.getInstance();
    this.client = axios.create({
      baseURL: context.baseUrl,
      timeout: context.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.context.apiKey
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.error(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
    );

    this.client.interceptors.response.use(
      (response) => {
        console.error(`[API Response] ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('[API Response Error]', error.response?.status, error.response?.statusText);
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  }

  public async executeRequest(
    method: string,
    path: string,
    parameters: Record<string, any> = {}
  ): Promise<TatumApiResponse> {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (!method || !path || !validMethods.includes(method.toUpperCase())) {
      return {
        error: 'Invalid method or path',
        status: 400,
        statusText: 'Bad Request'
      };
    }
    try {
      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url: this.buildUrl(path, parameters),
      };

      // Handle request body for POST/PUT requests
      if (['POST', 'PUT'].includes(method.toUpperCase())) {
        config.data = parameters;
      }

      const response: AxiosResponse = await this.client.request(config);

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error: any) {
      console.error(`API request failed: ${method} ${path}`, error.message);
      return {
        error: error.response?.data?.message ?? error.response?.statusText ?? error.message ?? 'Request failed',
        status: error.response?.status ?? 0,
        statusText: error.response?.statusText ?? 'Error'
      };
    }
  }

  private buildUrl(path: string, parameters: Record<string, any>): string {
    let url = path;
    const queryParams: string[] = [];
    const usedParams = new Set<string>();

    if (url.includes('{xApiKey}') && !parameters.xApiKey) {
      parameters.xApiKey = this.context.apiKey;
    }

    Object.keys(parameters).forEach(key => {
      const placeholder = `{${key}}`;
      if (url.includes(placeholder)) {
        url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(parameters[key]));
        usedParams.add(key);
      }
    });

    Object.keys(parameters).forEach(key => {
      if (!usedParams.has(key) && parameters[key] !== undefined && parameters[key] !== null) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
      }
    });

    if (queryParams.length > 0) {
      url += (url.includes('?') ? '&' : '?') + queryParams.join('&');
    }

    return url;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.executeRequest('GET', '/v4/data/supported-chains');
      return response.status >= 200 && response.status < 500;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  public async executeRpcCall(chain: string, method: string, params: any[] = []): Promise<TatumApiResponse> {
    if (!chain || !method) {
      return {
        error: 'Chain and method are required',
        status: 400,
        statusText: 'Bad Request'
      };
    }

    const gatewayUrl = this.config.getGatewayUrl(chain);
    if (!gatewayUrl) {
      return {
        error: `Gateway URL not found for chain: ${chain}`,
        status: 400,
        statusText: 'Bad Request'
      };
    }

    const isCustomRpc = this.config.hasCustomRpcUrl(chain);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (!isCustomRpc) {
        headers['X-API-Key'] = this.context.apiKey;
      }

      const response = await this.client.post(
        gatewayUrl,
        {
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        },
        {
          headers,
          baseURL: ''
        }
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error: any) {
      console.error(`RPC call failed: ${method} on ${chain}`, error.message);
      return {
        error: error.response?.data?.error?.message ?? error.response?.data?.message ?? error.response?.statusText ?? error.message ?? 'RPC call failed',
        status: error.response?.status ?? 0,
        statusText: error.response?.statusText ?? 'Error'
      };
    }
  }
}