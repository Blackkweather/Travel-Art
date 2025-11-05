// HTTP client for inter-service communication

import { ServiceRequest, ApiResponse } from '../types';
import { ServiceUnavailableError } from './errors';
import { Logger } from './logger';

const logger = new Logger('HttpClient');

export class HttpClient {
  private baseUrl: string;
  private serviceName: string;

  constructor(serviceName: string, baseUrl: string) {
    this.serviceName = serviceName;
    this.baseUrl = baseUrl;
  }

  async request<T = any>(request: Omit<ServiceRequest, 'serviceName'>): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${request.endpoint}`;
    
    try {
      logger.info(`${this.serviceName} - Making ${request.method} request to ${url}`);

      const response = await fetch(url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.data ? JSON.stringify(request.data) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`${this.serviceName} - Request failed`, new Error(data.error || data.message));
        throw new ServiceUnavailableError(data.error || data.message || 'Service request failed');
      }

      return data;
    } catch (error) {
      logger.error(`${this.serviceName} - Request error`, error as Error);
      throw new ServiceUnavailableError(`Failed to communicate with ${this.serviceName}`);
    }
  }

  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'GET', headers });
  }

  async post<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'POST', data, headers });
  }

  async put<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'PUT', data, headers });
  }

  async patch<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'PATCH', data, headers });
  }

  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ endpoint, method: 'DELETE', headers });
  }
}














