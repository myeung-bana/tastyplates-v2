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
        jsonResponse = false,
        jsonContentType = true
    ): Promise<any> {
        const headers = {
            ...(jsonContentType && { 'Content-Type': 'application/json' }),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const session = await getSession();
        const clonedResponse = response.clone();
        const jsonData: HttpResponse = await clonedResponse.json();

        // redirect back when unauthenticated request
        if (typeof window !== 'undefined' && (session?.accessToken && jsonData?.code == jwtAuthInvalidCode)) {
            await handleUnauthorized();
        }

        if (jsonResponse) {
            try {
                return response.json();
            } catch (error) {
                console.error('Failed to parse JSON response:', error);
                throw new Error('Invalid JSON response');
            }
        }

        return response;
    }

    async GET(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {},
        jsonResponse = false
    ) {
        return this.request(
            endpoint,
            {
                ...options,
                method: HTTP_METHODS.GET,
            },
            jsonResponse
        );
    }

    async POST(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {},
        jsonResponse = false
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
            jsonResponse,
            isJsonBody as boolean
        );
    }

    async PUT(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {},
        jsonResponse = false
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
            jsonResponse,
            isJsonBody as boolean
        );
    }

    async DELETE(
        endpoint: string,
        options: Omit<RequestInit, "method"> = {},
        jsonResponse = false
    ) {
        return this.request(
            endpoint,
            {
                ...options,
                method: HTTP_METHODS.DELETE,
            },
            jsonResponse
        );
    }
}
