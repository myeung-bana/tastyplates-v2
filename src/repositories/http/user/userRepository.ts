import client from "@/app/graphql/client";
import { GET_USER_BY_ID } from "@/app/graphql/User/userQueries";
import { HttpResponse } from "@/interfaces/httpResponse";
import { CheckEmailExistResponse, CheckGoogleUserResponse, CurrentUserResponse, followUserResponse, IJWTResponse, IRegisterData, isFollowingUserResponse, IUserUpdate, IUserUpdateResponse } from "@/interfaces/user/user";
import { UserRepo } from "../../interface/user/user";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class UserRepository implements UserRepo {
    async registerUser<T>(data: Partial<IRegisterData>): Promise<T> {
        const response = await request.POST('/wp-json/wp/v2/api/users', {
            body: JSON.stringify(data)
        });
        return response as T;
    }

    async login(credentials: { email: string; password: string }): Promise<IJWTResponse> {
        // Use unified endpoint - works for both manual login and Google OAuth
        return request.POST('/wp-json/wp/v2/api/users/unified-token',
            {
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });
    }

    async checkGoogleUser(email: string): Promise<CheckGoogleUserResponse> {
        const response = await request.POST('/wp-json/wp/v2/api/users/google-check',
            { body: JSON.stringify({ email }) });
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (response as any)?.status || 200,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: (response as any)?.message,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token: (response as any)?.token, // Will be null, token generated separately
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (response as any)?.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_login: (response as any)?.user_login,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_email: (response as any)?.user_email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            display_name: (response as any)?.display_name
        };
    }

    async generateGoogleUserToken(userId: number | string, email?: string): Promise<IJWTResponse> {
        // Use unified endpoint - no password needed for Google OAuth
        const body: { user_id?: number | string; email?: string } = {};
        if (userId) {
            body.user_id = userId;
        }
        if (email) {
            body.email = email;
        }
        // Unified endpoint handles Google OAuth when no password is provided
        const response = await request.POST('/wp-json/wp/v2/api/users/unified-token',
            { body: JSON.stringify(body) });
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token: (response as any)?.token,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (response as any)?.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_email: (response as any)?.user_email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_nicename: (response as any)?.user_nicename,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_display_name: (response as any)?.user_display_name
        };
    }

    async googleOAuth(idToken: string): Promise<IJWTResponse> {
        // Call WordPress Google OAuth endpoint directly - unified with manual login
        const response = await request.POST('/wp-json/wp/v2/api/users/google-oauth',
            {
                body: JSON.stringify({
                    id_token: idToken
                })
            });
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token: (response as any)?.token,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (response as any)?.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_email: (response as any)?.user_email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_nicename: (response as any)?.user_nicename,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_display_name: (response as any)?.user_display_name
        };
    }

    /**
     * Check if user exists via Nextend Social Login
     * Returns WordPress user ID if user exists, null if not found
     * Reference: https://social-login.nextendweb.com/documentation/for-developers/rest-api/
     */
    async nextendSocialLogin(accessToken: string): Promise<{ userId: string | null; error?: string }> {
        try {
            // Nextend expects access_token as JSON encoded string in POST body parameter
            // Format: {"access_token": "...", "expires_in": 3600, "token_type": "Bearer", "id_token": "..."}
            const tokenData = typeof accessToken === 'string' && accessToken.startsWith('{') 
                ? accessToken 
                : JSON.stringify({ access_token: accessToken });
            
            // Use fetch directly to handle form-encoded data properly
            const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;
            const formData = new URLSearchParams();
            formData.append('access_token', tokenData);
            
            const response = await fetch(`${API_BASE_URL}/wp-json/nextend-social-login/v1/google/get_user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            // Nextend returns WordPress user ID as string on success (status 200)
            // Error responses have status != 200 with error object
            if (response.status === 200) {
                const text = await response.text();
                // Success: Returns user ID as string (e.g., "44" or 44)
                const userId = text.trim().replace(/^"|"$/g, '');
                return { userId };
            }
            
            // Error response
            const errorData = await response.json().catch(() => ({}));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorResponse = errorData as any;
            return { 
                userId: null, 
                error: errorResponse?.message || 'User not found with this social account' 
            };
        } catch (error: any) {
            console.error('Nextend Social Login error:', error);
            // If status is not 200, user doesn't exist
            return { userId: null, error: error?.message || 'User not found' };
        }
    }

    async checkEmailExists<T>(email: string): Promise<T> {
        const response = await request.POST('/wp-json/wp/v2/api/users/check-email', {
            body: JSON.stringify({ email })
        });
        return response as T;
    }

    async checkUsernameExists(username: string): Promise<CheckEmailExistResponse> {
        const response = await request.POST('/wp-json/wp/v2/api/users/check-username', {
            body: JSON.stringify({ username }),
        });
        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            exists: (response as any)?.exists || false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (response as any)?.status || 200,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: (response as any)?.message
        };
    }

    async getCurrentUser(token?: string): Promise<CurrentUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
        const response = await request.GET('/wp-json/wp/v2/api/users/current', { headers: headers });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }

    async getUserById(
        id: number | null,
        accessToken?: string
    ): Promise<Record<string, unknown>> {
        const { data } = await client.query<{
            user: {
                id: string;
                databaseId: number;
                firstName: string;
                lastName: string;
                email: string;
                username: string;
                avatar?: {
                    url: string;
                };
            };
        }>({
            query: GET_USER_BY_ID,
            variables: { id },
            fetchPolicy: "no-cache",
            context: {
                headers: {
                    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
                },
            },
        });

        // Return empty object instead of null for production safety
        return (data?.user ?? {}) as Record<string, unknown>;
    }

    async updateUserFields(
        data: Partial<IUserUpdate>,
        token: string
    ): Promise<IUserUpdateResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await request.PUT(`/wp-json/wp/v2/api/users/update-fields`, {
            body: JSON.stringify(data),
            headers: headers
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }

    async validatePassword(password: string, token?: string): Promise<Record<string, unknown>> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.POST('/wp-json/wp/v2/api/users/validate-password', { body: JSON.stringify({ password }), headers: headers });
    }

    async getUserPalates<T>(userId: number, token?: string): Promise<T> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await request.GET(`/wp-json/restaurant/v1/user-palates?user_id=${userId}`, { headers: headers });
        return response as T;
    }

    async getFollowingList<T>(userId: number, token?: string): Promise<T> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await request.GET(`/wp-json/v1/following-list?user_id=${userId}`, { headers: headers });
        return response as T;
    }

    async getFollowersList<T>(userId: number, token?: string): Promise<T> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await request.GET(`/wp-json/v1/followers-list?user_id=${userId}`, { headers: headers });
        return response as T;
    }

    async followUser(userId: number, token?: string): Promise<followUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        try {
            const response = await request.POST(`/wp-json/v1/follow`, { 
                body: JSON.stringify({ user_id: userId }), 
                headers: headers 
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response as any;
        } catch (error) {
            console.error('Repository followUser error:', error);
            throw new Error('Failed to follow user');
        }
    }

    async unfollowUser(userId: number, token?: string): Promise<followUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        try {
            const response = await request.POST('/wp-json/v1/unfollow', { 
                body: JSON.stringify({ user_id: userId }), 
                headers: headers 
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response as any;
        } catch (error) {
            console.error('Repository unfollowUser error:', error);
            throw new Error('Failed to unfollow user');
        }
    }

    async isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        try {
            const response = await request.POST('/wp-json/v1/is-following', { 
                body: JSON.stringify({ user_id: userId }), 
                headers: headers 
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response as any;
        } catch (error) {
            console.error('Repository isFollowingUser error:', error);
            return { is_following: false };
        }
    }

    async sendForgotPasswordEmail(formData: FormData): Promise<HttpResponse> {
        const response = await request.POST(`/wp-json/wp/v2/api/users/forgot-password`, { body: formData, });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }

    async verifyResetToken(token?: string): Promise<HttpResponse> {
        const response = await request.GET(`/wp-json/wp/v2/api/users/verify-reset-token?token=${token}`, {});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }

    async resetPassword(token: string, password: string): Promise<HttpResponse> {
        const response = await request.POST(
            '/wp-json/wp/v2/api/users/reset-password', {
            body: JSON.stringify({
                token,
                password,
            })
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }
}
