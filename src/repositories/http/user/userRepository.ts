import client from "@/app/graphql/client";
import { GET_USER_BY_ID } from "@/app/graphql/User/userQueries";
import { HttpResponse } from "@/interfaces/httpResponse";
import { CheckEmailExistResponse, CheckGoogleUserResponse, CurrentUserResponse, followUserResponse, IJWTResponse, IRegisterData, isFollowingUserResponse, IUserUpdate, IUserUpdateResponse } from "@/interfaces/user/user";
import { UserRepo } from "../../interface/user/user";
import HttpMethods from "../requests";

const request = new HttpMethods();

export class UserRepository implements UserRepo {
    async registerUser<T>(data: Partial<IRegisterData>): Promise<T> {
        return request.POST('/wp-json/wp/v2/api/users', {
            body: JSON.stringify(data)
        });
    }

    async login(credentials: { email: string; password: string }): Promise<IJWTResponse> {
        return request.POST('/wp-json/jwt-auth/v1/token',
            {
                body: JSON.stringify({
                    username: credentials.email,
                    password: credentials.password
                })
            }, true);
    }

    async checkGoogleUser(email: string): Promise<CheckGoogleUserResponse> {
        return request.POST('/wp-json/wp/v2/api/users/google-check',
            { body: JSON.stringify({ email }) }, true);
    }

    async checkEmailExists<T>(email: string): Promise<T> {
        return request.POST('/wp-json/wp/v2/api/users/check-email', {
            body: JSON.stringify({ email })
        }, true);
    }

    async checkUsernameExists(username: string): Promise<CheckEmailExistResponse> {
        return request.POST('/wp-json/wp/v2/api/users/check-username', {
            body: JSON.stringify({ username }),
        }, true);
    }

    async getCurrentUser(token?: string): Promise<CurrentUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
        return request.GET('/wp-json/wp/v2/api/users/current', { headers: headers }, true);
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

        return request.PUT(`/wp-json/wp/v2/api/users/update-fields`, {
            body: JSON.stringify(data),
            headers: headers
        }, true);
    }

    async validatePassword(password: string, token?: string): Promise<Record<string, unknown>> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.POST('/wp-json/wp/v2/api/users/validate-password', { body: JSON.stringify({ password }), headers: headers }, true);
    }

    async getUserPalates<T>(userId: number, token?: string): Promise<T> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.GET(`/wp-json/restaurant/v1/user-palates?user_id=${userId}`, { headers: headers }, true);
    }

    async getFollowingList<T>(userId: number, token?: string): Promise<T> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.GET(`/wp-json/v1/following-list?user_id=${userId}`, { headers: headers }, true);
    }

    async getFollowersList<T>(userId: number, token?: string): Promise<T> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.GET(`/wp-json/v1/followers-list?user_id=${userId}`, { headers: headers }, true);
    }

    async followUser(userId: number, token?: string): Promise<followUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.POST(`/wp-json/v1/follow`, { body: JSON.stringify({ user_id: userId }), headers: headers }, true);
    }

    async unfollowUser(userId: number, token?: string): Promise<followUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.POST('/wp-json/v1/unfollow', { body: JSON.stringify({ user_id: userId }), headers: headers }, true);
    }

    async isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse> {
        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        return request.POST('/wp-json/v1/is-following', { body: JSON.stringify({ user_id: userId }), headers: headers }, true);
    }

    async sendForgotPasswordEmail(formData: FormData): Promise<HttpResponse> {
        return request.POST(`/wp-json/wp/v2/api/users/forgot-password`, { body: formData, }, true);
    }

    async verifyResetToken(token?: string): Promise<HttpResponse> {
        return request.GET(`/wp-json/wp/v2/api/users/verify-reset-token?token=${token}`, {}, true);
    }

    async resetPassword(token: string, password: string): Promise<HttpResponse> {
        return request.POST(
            '/wp-json/wp/v2/api/users/reset-password', {
            body: JSON.stringify({
                token,
                password,
            })
        },
            true
        );
    }
}
