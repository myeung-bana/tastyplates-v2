// Centralized API Type Definitions
// This file consolidates all API request/response types

/**
 * Standard HTTP Response Wrapper
 */
export interface HttpResponse<T = unknown> {
  status: boolean
  message: string
  code?: string | number
  data?: T
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false
  error: string
  details?: unknown[]
  message?: string
  hint?: string
}

/**
 * API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    total?: number
    limit?: number
    offset?: number
    hasMore?: boolean
    fetchedAt?: string
  }
}

/**
 * Generic API Response
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  limit?: number
  offset?: number
  page?: number
  pageSize?: number
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  page?: number
  totalPages?: number
}
