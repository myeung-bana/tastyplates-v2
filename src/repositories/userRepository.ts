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
        return this.request('/wp-json/wp/v2/api/users', {
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
        return this.request('/wp-json/wp/v2/api/users/google-check', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }, true);
    }

    static async checkEmailExists<T>(email: string): Promise<T> {
        return this.request('/wp-json/wp/v2/api/users/check-email', {
            method: 'POST',
            body: JSON.stringify({
                email
            }),
        }, true);
    }

    static async checkUsernameExists<T>(username: string): Promise<T> {
        return this.request('/wp-json/wp/v2/api/users/check-username', {
            method: 'POST',
            body: JSON.stringify({ username })
        }, true);
    }

    static async getCurrentUser<T>(token?: string): Promise<T> {
        return this.request(
            '/wp-json/wp/v2/api/users/current',
            {
                method: 'GET',
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
            },
            true
        );
    }

    static async updateUserFields<T>(
        data: {
            username?: string;
            email?: string;
            birthdate?: string;
            language?: string;
            password?: string;
            palates?: string;
            profile_image?: string;
            about_me?: string;
        },
        token: string
    ): Promise<T> {
        return this.request(
            `/wp-json/wp/v2/api/users/update-fields`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            },
            true
        );
    }

    static async validatePassword(password: string, token?: string): Promise<any> {
        return this.request(
            '/wp-json/wp/v2/api/users/validate-password',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            },
            true
        );
    }

    static async getUserPalates<T>(userId: number, token?: string): Promise<T> {
        return this.request(
            `/wp-json/restaurant/v1/user-palates?user_id=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            },
            true
        );
    }

    static async getFollowingList<T>(userId: number, token?: string): Promise<T> {
        return this.request(
            `/wp-json/v1/following-list?user_id=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            },
            true
        );
    }

    static async getFollowersList<T>(userId: number, token?: string): Promise<T> {
        return this.request(
            `/wp-json/v1/followers-list?user_id=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            },
            true
        );
    }

    static async followUser<T>(userId: number, token?: string): Promise<T> {
        return this.request(
            `/wp-json/v1/follow`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId }),
            },
            true
        );
    }

    static async unfollowUser<T>(userId: number, token?: string): Promise<T> {
        return this.request(
            `/wp-json/v1/unfollow`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId }),
            },
            true
        );
    }
}
