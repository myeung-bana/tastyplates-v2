import { UserRepository } from '@/repositories/http/user/userRepository';
import { CheckEmailExistResponse, CheckGoogleUserResponse, CurrentUserResponse, followUserResponse, IJWTResponse, ILoginCredentials, IRegisterData, isFollowingUserResponse, IUserUpdate, IUserUpdateResponse } from '@/interfaces/user/user';
import { DEFAULT_USER_ICON } from '@/constants/images';
import { responseStatusCode as code } from '@/constants/response';
import { unexpectedError } from '@/constants/messages';
import { HttpResponse } from '@/interfaces/httpResponse';
import { UserRepo } from '@/repositories/interface/user/user';

const userRepo: UserRepo = new UserRepository()

export class UserService {
    async registerUser(userData: Partial<IRegisterData>): Promise<Record<string, unknown>> {
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

        return await userRepo.registerUser<Record<string, unknown>>(formattedData);
    }

    async login(credentials: ILoginCredentials): Promise<IJWTResponse> {
        try {
            const res = await userRepo.login({
                email: credentials.email,
                password: credentials.password as string
            });

            return res;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    }

    async handleGoogleAuth(email: string): Promise<CheckGoogleUserResponse> {
        try {
            // First check if user exists and is a Google user
            const checkResponse = await userRepo.checkGoogleUser(email);
            
            // If user is verified, generate token using JWT Auth plugin standard
            if (checkResponse.status === 200 && checkResponse.id) {
                try {
                    const tokenResponse = await userRepo.generateGoogleUserToken(checkResponse.id, email);
                    if (!tokenResponse.token) {
                        // Token generation failed
                        return {
                            status: 500,
                            message: 'Failed to generate authentication token.',
                            id: checkResponse.id
                        };
                    }
                    // Ensure id is always set - use tokenResponse.id if available, otherwise checkResponse.id
                    const userId = tokenResponse.id || checkResponse.id;
                    if (!userId) {
                        console.error('handleGoogleAuth: No user ID available', {
                            tokenResponse,
                            checkResponse
                        });
                        return {
                            status: 500,
                            message: 'Failed to retrieve user ID.',
                            id: undefined
                        };
                    }
                    return {
                        ...checkResponse,
                        token: tokenResponse.token,
                        id: userId, // Ensure id is always set
                        user_email: tokenResponse.user_email || checkResponse.user_email,
                        user_display_name: tokenResponse.user_display_name || checkResponse.display_name
                    };
                } catch (tokenError) {
                    console.error('Token generation error:', tokenError);
                    return {
                        status: 500,
                        message: 'Failed to generate authentication token.',
                        id: checkResponse.id
                    };
                }
            }
            
            return checkResponse;
        } catch (error) {
            console.error('Google auth error:', error);
            throw error;
        }
    }

    async googleOAuth(idToken: string): Promise<IJWTResponse> {
        try {
            // Call WordPress OAuth endpoint directly - unified with manual login
            return await userRepo.googleOAuth(idToken);
        } catch (error) {
            console.error('Google OAuth error:', error);
            throw error;
        }
    }

    /**
     * Check if user exists via Nextend Social Login
     * Returns WordPress user ID if found, null if not found
     */
    async nextendSocialLogin(accessToken: string): Promise<{ userId: string | null; error?: string }> {
        try {
            return await userRepo.nextendSocialLogin(accessToken);
        } catch (error) {
            console.error('Nextend Social Login error:', error);
            return { userId: null, error: 'Failed to check user with Nextend Social Login' };
        }
    }

    /**
     * Generate JWT token for Google OAuth user
     */
    async generateGoogleUserToken(userId: number | string, email?: string): Promise<IJWTResponse> {
        try {
            return await userRepo.generateGoogleUserToken(userId, email);
        } catch (error) {
            console.error('Generate Google user token error:', error);
            throw error;
        }
    }

    async checkEmailExists(email: string): Promise<Record<string, unknown>> {
        try {
            const res = await userRepo.checkEmailExists<Record<string, unknown>>(email);
            return res;
        } catch (error) {
            console.error('Check email error:', error);
            throw error;
        }
    }

    async checkUsernameExists(username: string): Promise<CheckEmailExistResponse> {
        try {
            const res = await userRepo.checkUsernameExists(username);
            return res;
        } catch (error) {
            console.error('Check username error:', error);
            throw error;
        }
    }

    async getCurrentUser(token?: string): Promise<CurrentUserResponse> {
        try {
            const res = await userRepo.getCurrentUser(token);
            return res;
        } catch (error) {
            console.error('Get user by ID error:', error);
            throw new Error('Failed to fetch user data');
        }
    }

    async getUserById(id: number | null) {
        try {
            return await userRepo.getUserById(id);
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            throw new Error('Failed to fetch user by ID');
        }
    }

    async updateUserFields(data: Partial<IUserUpdate>, token?: string): Promise<IUserUpdateResponse> {
        try {
            if (!token) {
                throw new Error('Token is required for updating user fields');
            }
            const res = await userRepo.updateUserFields(data, token);
            return res;
        } catch (error) {
            console.error('Update user fields error:', error);
            throw new Error('Failed to update user fields');
        }
    }

    async validatePassword(password: string, token?: string): Promise<Record<string, unknown>> {
        try {
            const res = await userRepo.validatePassword(password, token);
            return res;
        } catch (error) {
            console.error('Validate password error:', error);
            throw new Error('Failed to validate password');
        }
    }

    async getUserPalates(userId: number, token?: string): Promise<Record<string, unknown>> {
        try {
            const res = await userRepo.getUserPalates<Record<string, unknown>>(userId, token);
            return res;
        } catch (error) {
            console.error('Get user palates error:', error);
            throw new Error('Failed to fetch user palates');
        }
    }

    async getFollowingList(userId: number, token?: string): Promise<Record<string, unknown>[]> {
        try {
            const res = await userRepo.getFollowingList<Record<string, unknown>>(userId, token);
            return Array.isArray(res) ? res.map(user => ({
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

    async getFollowersList(userId: number, followingList: Record<string, unknown>[], token?: string): Promise<Record<string, unknown>[]> {
        try {
            const res = await userRepo.getFollowersList<Record<string, unknown>>(userId, token);
            return Array.isArray(res) ? res.map(user => ({
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

    async followUser(userId: number, token?: string): Promise<followUserResponse> {
        try {
            const res = await userRepo.followUser(userId, token);
            return {
                ...res,
                status: res.status || code.success,
            };
        } catch (error) {
            console.error('Follow user error:', error);
            return {
                result: 'error',
                following: 0,
                followers: 0,
                status: 500,
                message: 'Failed to follow user. Please try again.'
            };
        }
    }

    async unfollowUser(userId: number, token?: string): Promise<followUserResponse> {
        try {
            const res = await userRepo.unfollowUser(userId, token);
            return {
                ...res,
                status: res.status || code.success,
            };
        } catch (error) {
            console.error('Unfollow user error:', error);
            return {
                result: 'error',
                following: 0,
                followers: 0,
                status: 500,
                message: 'Failed to unfollow user. Please try again.'
            };
        }
    }

    async isFollowingUser(userId: number, token?: string): Promise<isFollowingUserResponse> {
        try {
            const res = await userRepo.isFollowingUser(userId, token);
            return res;
        } catch (error) {
            console.error('Check following user error:', error);
            return { is_following: false };
        }
    }

    async sendForgotPasswordEmail(formData: FormData): Promise<HttpResponse> {
        try {
            const res = await userRepo.sendForgotPasswordEmail(formData);    
            return res;
        } catch (error) {
            console.error('Forgot password email error:', error);
            return { status: false, message: unexpectedError };
        }
    }

    async verifyResetToken(token?: string): Promise<HttpResponse> {
        try {
            const res = await userRepo.verifyResetToken(token);
            return res;
        } catch (error) {
            console.error('Verify reset token error:', error);
            return { status: false, message: unexpectedError };
        }
    }

    async resetPassword(token: string, password: string): Promise<HttpResponse> {
        try {
            const res = await userRepo.resetPassword(token, password);
            return res;
        } catch (error) {
            console.error('Reset password error:', error);
            return { status: false, message: unexpectedError };
        }
    }
}
