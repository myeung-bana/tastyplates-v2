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
