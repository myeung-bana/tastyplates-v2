import { HTTP_METHODS } from "@/constants/httpMethods";
import { sessionExpired } from "@/constants/messages";
import { HOME } from "@/constants/pages";
import { responseStatusCode as code, jwtAuthInvalidCode } from "@/constants/response";
import { SESSION_EXPIRED_KEY } from "@/constants/session";
import { HttpResponse } from "@/interfaces/httpResponse";
import { removeAllCookies } from "@/utils/removeAllCookies";
import { getSession, signOut } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;

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

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // only happens when status error in backend request
        if (response.status == code.unauthorized || response.status == code.forbidden) {
            const session = await getSession();
            const clonedResponse = response.clone();
            const jsonData: HttpResponse = await clonedResponse.json();

            // redirect back when unauthenticated request
            if (typeof window !== 'undefined' && (session?.accessToken && jsonData?.code == jwtAuthInvalidCode)) {
                await handleUnauthorized();
            }
        }

        try {
            return await response.json() as Record<string, unknown>;
        } catch (error) {
            console.error('Failed to parse JSON response:', error);
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
