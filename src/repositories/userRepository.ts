import { ApiService } from '@/services/api';
import { IUserRegistration, IWordPressResponse, ILoginCredentials, IJWTResponse } from '@/interfaces/user';

interface GoogleAuthResponse {
    exists: boolean;
    user?: {
        email: string;
        username: string;
    };
}

export class UserRepository {
    static async registerUser(userData: any): Promise<any> {
        const formattedData = {
            username: userData.username, // done
            email: userData.email, // done
            password: userData.password, // done
            birthdate: userData.birthdate, 
            gender: userData.gender, 
            custom_gender: userData.customGender,
            pronoun: userData.pronoun,
            palates: userData.palates,
            profile_image: userData.profileImage,
            about_me: userData.aboutMe,
            is_google_user: !!userData.googleAuth,
            google_token: userData.googleToken || null
        };

        await ApiService.registerUser<any>(formattedData);
    }

    static async login(credentials: ILoginCredentials): Promise<IJWTResponse> {
        try {
            const response = await ApiService.login<IJWTResponse>({
                email: credentials.email,
                password: credentials.password as string
            });
            
            // Store JWT token
            if (response.token) {
                localStorage.setItem('auth_token', response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    }

    static async handleGoogleAuth(email: string, googleToken: string): Promise<IJWTResponse> {
        try {
            // First check if user exists
            const checkResponse = await ApiService.checkGoogleUser<GoogleAuthResponse>(email);
            
            if (checkResponse.exists) {
                // User exists, proceed with login
                const loginResponse = await ApiService.loginWithGoogle<IJWTResponse>({
                    email,
                    googleToken
                });
                
                if (loginResponse.token) {
                    localStorage.setItem('auth_token', loginResponse.token);
                }
                
                return loginResponse;
            } else {
                // User doesn't exist, throw error to redirect to registration
                throw new Error('GOOGLE_USER_NOT_REGISTERED');
            }
        } catch (error) {
            console.error('Google auth error:', error);
            throw error;
        }
    }
}
