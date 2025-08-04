import client from "@/app/graphql/client";
import { GET_USER_BY_ID } from "@/app/graphql/User/userQueries";
import { CheckEmailExistResponse, CheckGoogleUserResponse, CurrentUserResponse, followUserResponse, IJWTResponse, IRegisterData, isFollowingUserResponse, IUserUpdate, IUserUpdateResponse } from "@/interfaces/user/user";

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

    static async registerUser<T>(data: Partial<IRegisterData>): Promise<T> {
        return this.request('/wp-json/wp/v2/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async login(credentials: { email: string; password: string }): Promise<IJWTResponse> {
        return this.request('/wp-json/jwt-auth/v1/token', {
            method: 'POST',
            body: JSON.stringify({
                username: credentials.email,
                password: credentials.password
            }),
        }, true);
    }

    static async checkGoogleUser(email: string): Promise<CheckGoogleUserResponse> {
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

    static async checkUsernameExists(username: string): Promise<CheckEmailExistResponse> {
        return this.request('/wp-json/wp/v2/api/users/check-username', {
            method: 'POST',
            body: JSON.stringify({ username })
        }, true);
    }

    static async getCurrentUser(token?: string): Promise<CurrentUserResponse> {
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

    static async getUserById(
        id: number | null,
        accessToken?: string,
    ) {
        const { data } = await client.query({
            query: GET_USER_BY_ID,
            variables: { id },
            fetchPolicy: "no-cache",
        });

        return data.user;
    }

    static async updateUserFields<T>(
        data: Partial<IUserUpdate>,
        token: string
    ): Promise<IUserUpdateResponse> {
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

    static async followUser(userId: number, token?: string): Promise<followUserResponse> {
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

    static async unfollowUser(userId: number, token?: string): Promise<followUserResponse> {
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

    static async isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse> {
        return this.request(
            `/wp-json/v1/is-following`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId }),
            },
            true
        );
    }
}
