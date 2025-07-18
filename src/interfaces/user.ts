export interface ILoginCredentials {
    email: string;
    password?: string;
    googleToken?: string;
}

export interface IJWTResponse {
    token: string;
    user_email: string;
    user_nicename: string;
    user_display_name: string;
}

export interface IRegisterData {
    username: string,
    email: string,
    password: string,
    birthdate?: string,
    gender?: string,
    customGender?: string,
    pronoun?: string,
    palates?: any,
    profileImage?: any,
    aboutMe?: string,
    is_google_user?: boolean,
    googleToken: any,
    googleAuth: any
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
    code?: any;
}