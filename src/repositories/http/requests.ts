import { HTTP_METHODS } from "@/constants/httpMethods";
import { sessionExpired } from "@/constants/messages";
import { HOME } from "@/constants/pages";
import { responseStatusCode as code, jwtAuthInvalidCode } from "@/constants/response";
import { SESSION_EXPIRED_KEY } from "@/constants/session";
import { HttpResponse } from "@/interfaces/httpResponse";
import { removeAllCookies } from "@/utils/removeAllCookies";
import { getSession, signOut } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;
const USE_WP_PROXY = process.env.NEXT_PUBLIC_USE_WP_PROXY === 'true';

const handleUnauthorized = async () => {
    removeAllCookies();
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = '__Host-next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Lax';
    localStorage.setItem(SESSION_EXPIRED_KEY, sessionExpired);
    await signOut({
        callbackUrl: HOME,
    })
}

export default class HttpMethods {
    private async request(
        endpoint: string,
        options: RequestInit,
        jsonContentType = true
    ): Promise<Record<string, unknown>> {
        const headers = {
            ...(jsonContentType && { 'Content-Type': 'application/json' }),
            ...options.headers,
        };

        const isWpJson = endpoint && endpoint.startsWith('/wp-json');
        // On server-side, always use direct API URL (proxy only works client-side)
        const isServerSide = typeof window === 'undefined';
        const fetchUrl = USE_WP_PROXY && isWpJson && !isServerSide 
            ? `/api/wp-proxy${endpoint}` 
            : `${API_BASE_URL}${endpoint}`;

        // Add timeout to prevent hanging requests (only on client-side)
        // Only add timeout if no signal is already provided
        const hasExistingSignal = options.signal !== undefined;
        const controller = !hasExistingSignal && typeof AbortController !== 'undefined' 
            ? new AbortController() 
            : null;
        const timeoutId = controller ? setTimeout(() => {
            controller.abort();
        }, 10000) : null; // 10 second timeout

        let response: Response;
        try {
            response = await fetch(fetchUrl, {
                ...options,
                headers,
                signal: controller?.signal || options.signal,
            });
            
            if (timeoutId) clearTimeout(timeoutId);
        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                // Check if it was our timeout or the existing signal
                if (controller && controller.signal.aborted) {
                    throw new Error('Request timeout');
                }
            }
            throw error;
        }

        // Handle error responses (401, 403) - but don't throw, return the error response
        if (response.status == code.unauthorized || response.status == code.forbidden) {
            const session = await getSession();
            const clonedResponse = response.clone();
            
            try {
                const jsonData: HttpResponse = await clonedResponse.json();

                // redirect back when unauthenticated request (only for JWT auth errors)
                if (typeof window !== 'undefined' && (session?.accessToken && jsonData?.code == jwtAuthInvalidCode)) {
                    await handleUnauthorized();
                }
                
                // Return the error response instead of throwing
                // This allows public endpoints that return 403 to be handled gracefully
                return jsonData as Record<string, unknown>;
            } catch (parseError) {
                // If JSON parsing fails, return a generic error object
                console.warn('Failed to parse error response as JSON, returning generic error:', parseError);
                return {
                    status: response.status,
                    message: response.statusText || 'Request failed',
                    code: response.status === code.forbidden ? 'rest_forbidden' : 'rest_unauthorized'
                } as Record<string, unknown>;
            }
        }

        // Handle successful responses
        try {
            return await response.json() as Record<string, unknown>;
        } catch (error) {
            console.error('Failed to parse JSON response:', error);
            // For non-error status codes, still throw if JSON parsing fails
            throw new Error('Invalid JSON response');
        }
    }

    async GET(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {}
    ) {
        return this.request(
            endpoint,
            {
                ...options,
                method: HTTP_METHODS.GET,
            }
        );
    }

    async POST(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {}
    ) {
        const { body, ...restOptions } = options;
        const isJsonBody = body && !(body instanceof FormData);

        return this.request(
            endpoint,
            {
                ...restOptions,
                method: HTTP_METHODS.POST,
                body,
            },
            isJsonBody as boolean
        );
    }

    async PUT(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {}
    ) {
        const { body, ...restOptions } = options;
        const isJsonBody = body && !(body instanceof FormData);

        return this.request(
            endpoint,
            {
                ...restOptions,
                method: HTTP_METHODS.PUT,
                body,
            },
            isJsonBody as boolean
        );
    }

    async DELETE(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {}
    ) {
        return this.request(
            endpoint,
            {
                ...options,
                method: HTTP_METHODS.DELETE,
            }
        );
    }
}
