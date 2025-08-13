const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;

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
                method: 'GET',
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
                method: 'POST',
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
                method: 'PUT',
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
                method: 'DELETE',
            },
            jsonResponse
        );
    }
}
