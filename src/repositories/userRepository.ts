const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;

export class UserRepository {
    private static async request(endpoint: string, options: RequestInit, jsonResponse = false): Promise<any> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (jsonResponse) {
            return response.json();
        }

        return response;
    }

    static async registerUser<T>(data: any): Promise<T> {
        return this.request('/wp-json/wp/v2/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async login<T>(credentials: { email: string; password: string }): Promise<T> {
        return this.request('/wp-json/jwt-auth/v1/token', {
            method: 'POST',
            body: JSON.stringify({
                username: credentials.email,
                password: credentials.password
            }),
        }, true);
    }

    static async checkGoogleUser<T>(email: string): Promise<T> {
        return this.request('/wp-json/wp/v2/users/google-check', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }, true);
    }

    static async checkEmailExists<T>(email: string): Promise<T> {
        return this.request('/wp-json/wp/v2/users/check-email', {
            method: 'POST',
            body: JSON.stringify({
                email
            }),
        }, true);
    }
}
