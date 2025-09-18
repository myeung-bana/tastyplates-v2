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
        return request.POST('/wp-json/jwt-auth/v1/token',
            {
                body: JSON.stringify({
                    username: credentials.email,
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
            token: (response as any)?.token,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (response as any)?.id
        };
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
    ) {
        const { data } = await client.query({
            query: GET_USER_BY_ID,
            variables: { id },
            fetchPolicy: "no-cache",
        });

        return data.user;
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

        const response = await request.POST(`/wp-json/v1/follow`, { body: JSON.stringify({ user_id: userId }), headers: headers });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }

    async unfollowUser(userId: number, token?: string): Promise<followUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await request.POST('/wp-json/v1/unfollow', { body: JSON.stringify({ user_id: userId }), headers: headers });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
    }

    async isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const response = await request.POST('/wp-json/v1/is-following', { body: JSON.stringify({ user_id: userId }), headers: headers });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response as any;
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
