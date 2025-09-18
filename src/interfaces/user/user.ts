export interface ILoginCredentials {
    email: string;
    password?: string;
    googleToken?: string;
}

export interface IJWTResponse {
    id?: number;
    token?: string;
    user_email?: string;
    user_nicename?: string;
    user_display_name?: string;
}

export interface IRegisterData {
    username: string,
    email: string,
    password: string,
    birthdate?: string,
    gender?: string,
    customGender?: string,
    pronoun?: string,
    palates?: string[],
    profileImage?: string,
    aboutMe?: string,
    is_google_user?: boolean,
    googleToken: string,
    googleAuth: string
}

export interface IUserUpdate {
    username: string;
    email: string;
    birthdate: string;
    language: string;
    password: string;
    palates: string;
    profile_image: string;
    about_me: string;
}

export interface IUserUpdateResponse {
    id: number;
    username: string;
    email: string;
    birthdate: string;
    language: string;
    profile_image: string;
    message: string;
    status: number;
    code?: string | number;
    data?: {
        status?: number;
    }
}

export interface CheckGoogleUserResponse {
    status: number;
    message?: string;
    token?: string;
    id?: number;
}

export interface CurrentUserResponse {
    id?: number;
    ID?: number;
    user_login?: string;
    user_email: string;
    display_name?: string;
    profile_image?: string;
    birthdate?: string;
    language?: string;
    palates?: string;
    about_me?: string;
}

export interface CheckEmailExistResponse {
    exists: boolean;
    status: number;
    message?: string;
}

export interface followUserResponse {
    result: string;
    following: number | string;
    followers: number | string;
    status?: number;
    message?: string;
}

export interface isFollowingUserResponse {
    is_following: boolean;
    status?: number;
    message?: string;
}