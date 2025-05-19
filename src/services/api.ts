const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;

export class ApiService {
    private static async request(endpoint: string, options: RequestInit): Promise<any> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        return response;
    }

    static async registerUser<T>(data: any): Promise<T> {
        return this.request('/wp-json/wp/v2/users', {
            method: 'POST',
            // headers: {
            //     'Authorization': `Bearer ${token}`
            // },
            body: JSON.stringify(data),
        });
    }

    static async login<T>(credentials: { email: string; password: string }): Promise<T> {
        return this.request('/wp-json/jwt-auth/v1/token', {
            method: 'POST',
            body: JSON.stringify({
                username: credentials.email, // Use email as username
                password: credentials.password
            }),
        });
    }

    static async checkGoogleUser<T>(email: string): Promise<T> {
        return this.request('/wp/v2/users/google-check', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    static async loginWithGoogle<T>(data: { email: string, googleToken: string }): Promise<T> {
        return this.request('/wp/v2/users/google-login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}
