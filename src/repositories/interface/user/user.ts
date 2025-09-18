import {
    CheckEmailExistResponse,
    CheckGoogleUserResponse,
    CurrentUserResponse,
    followUserResponse,
    IJWTResponse,
    IRegisterData,
    isFollowingUserResponse,
    IUserUpdate,
    IUserUpdateResponse,
} from "@/interfaces/user/user";

import { HttpResponse } from "@/interfaces/httpResponse";

export interface UserRepo {
    registerUser<T>(data: Partial<IRegisterData>): Promise<T>;
    login(credentials: { email: string; password: string }): Promise<IJWTResponse>;
    checkGoogleUser(email: string): Promise<CheckGoogleUserResponse>;
    checkEmailExists<T>(email: string): Promise<T>;
    checkUsernameExists(username: string): Promise<CheckEmailExistResponse>;
    getCurrentUser(token?: string): Promise<CurrentUserResponse>;
    getUserById(id: number | null, accessToken?: string): Promise<Record<string, unknown>>;
    updateUserFields(data: Partial<IUserUpdate>, token: string): Promise<IUserUpdateResponse>;
    validatePassword(password: string, token?: string): Promise<Record<string, unknown>>;
    getUserPalates<T>(userId: number, token?: string): Promise<T>;
    getFollowingList<T>(userId: number, token?: string): Promise<T>;
    getFollowersList<T>(userId: number, token?: string): Promise<T>;
    followUser(userId: number, token?: string): Promise<followUserResponse>;
    unfollowUser(userId: number, token?: string): Promise<followUserResponse>;
    isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse>;
    sendForgotPasswordEmail(formData: FormData): Promise<HttpResponse>;
    verifyResetToken(token?: string): Promise<HttpResponse>;
    resetPassword(token: string, password: string): Promise<HttpResponse>;
}
