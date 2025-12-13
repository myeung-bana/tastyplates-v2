import { HTTP_METHODS } from "@/constants/httpMethods";
import { sessionExpired } from "@/constants/messages";
import { HOME } from "@/constants/pages";
import { responseStatusCode as code, jwtAuthInvalidCode } from "@/constants/response";
import { SESSION_EXPIRED_KEY } from "@/constants/session";
import { HttpResponse } from "@/interfaces/httpResponse";
import { removeAllCookies } from "@/utils/removeAllCookies";
import { firebaseAuthService } from "@/services/auth/firebaseAuthService";

const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;
const USE_WP_PROXY = process.env.NEXT_PUBLIC_USE_WP_PROXY === 'true';

const handleUnauthorized = async () => {
    try {
        // Sign out from Firebase
        await firebaseAuthService.signOut();
    } catch (error) {
        console.error('Error signing out from Firebase:', error);
    }
    
    removeAllCookies();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem(SESSION_EXPIRED_KEY, sessionExpired);
    
    // Redirect to home
    if (typeof window !== 'undefined') {
        window.location.href = HOME;
    }
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

        // Helper function to check if Authorization header is present
        const checkAuthHeader = (headerObj: HeadersInit | undefined): boolean => {
            if (!headerObj) return false;
            if (headerObj instanceof Headers) {
                return headerObj.has('Authorization');
            }
            if (Array.isArray(headerObj)) {
                return headerObj.some(([key]) => key.toLowerCase() === 'authorization');
            }
            if (typeof headerObj === 'object') {
                return 'Authorization' in headerObj || 'authorization' in headerObj;
            }
            return false;
        };

        // Check if this is an authenticated request (POST/PUT/DELETE with Authorization header)
        const hasAuthHeader = checkAuthHeader(headers);
        const isAuthenticatedRequest = (
            (options.method === HTTP_METHODS.POST || 
             options.method === HTTP_METHODS.PUT || 
             options.method === HTTP_METHODS.DELETE) &&
            hasAuthHeader
        );

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

        // Handle error responses (401, 403)
        if (response.status == code.unauthorized || response.status == code.forbidden) {
            const clonedResponse = response.clone();
            
            try {
                const jsonData: HttpResponse = await clonedResponse.json();

                // For authenticated requests, throw the error so it can be properly caught
                if (isAuthenticatedRequest) {
                    const errorMessage = jsonData?.message || response.statusText || 'Request failed';
                    const error = new Error(errorMessage) as any;
                    error.status = response.status;
                    error.code = jsonData?.code;
                    error.data = jsonData;
                    throw error;
                }

                // For public GET requests, handle JWT auth errors
                // Check if user is authenticated via Firebase
                if (typeof window !== 'undefined') {
                    try {
                        const { auth } = await import('@/lib/firebase');
                        const currentUser = auth.currentUser;
                        if (currentUser && jsonData?.code == jwtAuthInvalidCode) {
                            await handleUnauthorized();
                        }
                    } catch (firebaseError) {
                        // Firebase not available, skip unauthorized handling
                        console.warn('Firebase auth not available:', firebaseError);
                    }
                }
                
                // Return the error response for public endpoints (GET requests without auth)
                return jsonData as Record<string, unknown>;
            } catch (parseError) {
                // For authenticated requests, throw error even if JSON parsing fails
                if (isAuthenticatedRequest) {
                    const error = new Error(response.statusText || 'Request failed') as any;
                    error.status = response.status;
                    error.code = response.status === code.forbidden ? 'rest_forbidden' : 'rest_unauthorized';
                    throw error;
                }

                // For public endpoints, return generic error object
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
