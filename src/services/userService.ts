import { UserRepository } from '@/repositories/userRepository';
import { ILoginCredentials, IJWTResponse } from '@/interfaces/user';

export class UserService {
    static async registerUser(userData: any): Promise<any> {
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

    static async login(credentials: ILoginCredentials): Promise<any> {
        try {
            const response = await UserRepository.login<any>({
                email: credentials.email,
                password: credentials.password as string
            });

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    }

    static async handleGoogleAuth(email: string): Promise<any> {
        try {
            // First check if user exists
            const checkResponse = await UserRepository.checkGoogleUser<any>(email);
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

    static async checkUsernameExists(username: string): Promise<any> {
        try {
            const response = await UserRepository.checkUsernameExists<any>(username);
            return response;
        } catch (error) {
            console.error('Check username error:', error);
            throw error;
        }
    }

    static async getCurrentUser(token?: string): Promise<any> {
        try {
            const response = await UserRepository.getCurrentUser<any>(token);
            return response;
        } catch (error) {
            console.error('Get user by ID error:', error);
            throw new Error('Failed to fetch user data');
        }
    }

    static async getUserById(id: number |null) {
        try {
            return await UserRepository.getUserById(id);
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            throw new Error('Failed to fetch user by ID');
        }
    }

    static async updateUserFields(data: any, token?: any): Promise<any> {
        try {
            const response = await UserRepository.updateUserFields<any>(data, token);
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
                image: user.image || "/profile-icon.svg",
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
                image: user.image || "/profile-icon.svg",
                isFollowing: followingList.some(f => f.id === user.id),
            })) : [];
        } catch (error) {
            console.error('Get followers list error:', error);
            return [];
        }
    }

    static async followUser(userId: number, token?: string): Promise<boolean> {
        try {
            await UserRepository.followUser<any>(userId, token);
            return true;
        } catch (error) {
            console.error('Follow user error:', error);
            return false;
        }
    }

    static async unfollowUser(userId: number, token?: string): Promise<boolean> {
        try {
            await UserRepository.unfollowUser<any>(userId, token);
            return true;
        } catch (error) {
            console.error('Unfollow user error:', error);
            return false;
        }
    }
}
