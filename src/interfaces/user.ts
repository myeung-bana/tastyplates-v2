export interface IUserRegistration {
    username: string;
    email: string;
    password: string;
    birthdate: string;
    gender: string;
    custom_gender?: string;
    pronoun?: string;
    palates: string[];
    profile_image?: string;
    about_me?: string;
    googleAuth?: boolean;
    googleToken?: string;
}

export interface IWordPressResponse {
    id: number;
    username: string;
    email: string;
    roles: string[];
    meta: {
        birthdate: string;
        gender: string;
        custom_gender?: string;
        pronoun?: string;
        palates: string[];
        profile_image?: string;
        about_me?: string;
    };
}

export interface ILoginCredentials {
    email: string;
    password?: string;
    googleToken?: string;
}

export interface ILoginResponse {
    token: string;
    user: {
        id: number;
        email: string;
        username: string;
    };
}

export interface IJWTResponse {
    token: string;
    user_email: string;
    user_nicename: string;
    user_display_name: string;
}
