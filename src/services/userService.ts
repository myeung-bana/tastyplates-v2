import { UserRepository } from '@/repositories/userRepository';
import { CheckEmailExistResponse, CheckGoogleUserResponse, CurrentUserResponse, followUserResponse, IJWTResponse, ILoginCredentials, IRegisterData, isFollowingUserResponse, IUserUpdate, IUserUpdateResponse } from '@/interfaces/user/user';
import { DEFAULT_USER_ICON } from '@/constants/images';
import { responseStatusCode as code } from '@/constants/response';
import { resetEmailFailed, unexpectedError } from '@/constants/messages';
import { HttpResponse } from '@/interfaces/httpResponse';

export class UserService {
    static async registerUser(userData: Partial<IRegisterData>): Promise<any> {
        const formattedData = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
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

        await UserRepository.registerUser<any>(formattedData);
    }

    static async login(credentials: ILoginCredentials): Promise<IJWTResponse> {
        try {
            const response = await UserRepository.login({
                email: credentials.email,
                password: credentials.password as string
            });

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    }

    static async handleGoogleAuth(email: string): Promise<CheckGoogleUserResponse> {
        try {
            // First check if user exists
            const checkResponse = await UserRepository.checkGoogleUser(email);
            return checkResponse;
        } catch (error) {
            console.error('Google auth error:', error);
            throw error;
        }
    }

    static async checkEmailExists(email: string): Promise<any> {
        try {
            const response = await UserRepository.checkEmailExists<any>(email);
            return response;
        } catch (error) {
            console.error('Check email error:', error);
            throw error;
        }
    }

    static async checkUsernameExists(username: string): Promise<CheckEmailExistResponse> {
        try {
            const response = await UserRepository.checkUsernameExists(username);
            return response;
        } catch (error) {
            console.error('Check username error:', error);
            throw error;
        }
    }

    static async getCurrentUser(token?: string): Promise<CurrentUserResponse> {
        try {
            const response = await UserRepository.getCurrentUser(token);
            return response;
        } catch (error) {
            console.error('Get user by ID error:', error);
            throw new Error('Failed to fetch user data');
        }
    }

    static async getUserById(id: number | null) {
        try {
            return await UserRepository.getUserById(id);
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            throw new Error('Failed to fetch user by ID');
        }
    }

    static async updateUserFields(data: Partial<IUserUpdate>, token?: any): Promise<IUserUpdateResponse> {
        try {
            const response = await UserRepository.updateUserFields<IUserUpdateResponse>(data, token);
            return response;
        } catch (error) {
            console.error('Update user fields error:', error);
            throw new Error('Failed to update user fields');
        }
    }

    static async validatePassword(password: string, token?: any): Promise<any> {
        try {
            const response = await UserRepository.validatePassword(password, token);
            return response;
        } catch (error) {
            console.error('Validate password error:', error);
            throw new Error('Failed to validate password');
        }
    }

    static async getUserPalates(userId: number, token?: string): Promise<any> {
        try {
            const response = await UserRepository.getUserPalates<any>(userId, token);
            return response;
        } catch (error) {
            console.error('Get user palates error:', error);
            throw new Error('Failed to fetch user palates');
        }
    }

    static async getFollowingList(userId: number, token?: string): Promise<any[]> {
        try {
            const response = await UserRepository.getFollowingList<any>(userId, token);
            return Array.isArray(response) ? response.map(user => ({
                id: user.id,
                name: user.name,
                cuisines: user.palates || [],
                image: user.image || DEFAULT_USER_ICON,
                isFollowing: true,
            })) : [];
        } catch (error) {
            console.error('Get following list error:', error);
            return [];
        }
    }

    static async getFollowersList(userId: number, followingList: any[], token?: string): Promise<any[]> {
        try {
            const response = await UserRepository.getFollowersList<any>(userId, token);
            return Array.isArray(response) ? response.map(user => ({
                id: user.id,
                name: user.name,
                cuisines: user.palates || [],
                image: user.image || DEFAULT_USER_ICON,
                isFollowing: followingList.some(f => f.id === user.id),
            })) : [];
        } catch (error) {
            console.error('Get followers list error:', error);
            return [];
        }
    }

    static async followUser(userId: number, token?: string): Promise<followUserResponse> {
        try {
            const response = await UserRepository.followUser(userId, token);
            return {
                ...response,
                status: code.success,
            };
        } catch (error) {
            console.error('Follow user error:', error);
            return {} as followUserResponse;
        }
    }

    static async unfollowUser(userId: number, token?: string): Promise<followUserResponse> {
        try {
            const response = await UserRepository.unfollowUser(userId, token);
            return {
                ...response,
                status: code.success,
            };
        } catch (error) {
            console.error('Unfollow user error:', error);
            return {} as followUserResponse;
        }
    }

    static async isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse> {
        try {
            const response = await UserRepository.isFollowingUser(userId, token);
            return response;
        } catch (error) {
            console.error('Check following user error:', error);
            return { is_following: false };
        }
    }

    static async sendForgotPasswordEmail(formData: FormData): Promise<HttpResponse> {
        try {
            const response = await UserRepository.sendForgotPasswordEmail(formData);    
            return response;
        } catch (error) {
            console.error('Forgot password email error:', error);
            return { status: false, message: unexpectedError };
        }
    }

    static async verifyResetToken(token?: string): Promise<HttpResponse> {
        try {
            const response = await UserRepository.verifyResetToken(token);
            return response;
        } catch (error) {
            console.error('Verify reset token error:', error);
            return { status: false, message: unexpectedError };
        }
    }

    static async resetPassword(token: string, password: string): Promise<HttpResponse> {
        try {
            const response = await UserRepository.resetPassword(token, password);
            return response;
        } catch (error) {
            console.error('Reset password error:', error);
            return { status: false, message: unexpectedError };
        }
    }
}
