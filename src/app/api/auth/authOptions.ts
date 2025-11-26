import { AuthOptions, User, Account } from "next-auth";
import { cookies } from "next/headers";
import CredentialsProvider from "next-auth/providers/credentials";
// Removed GoogleProvider - OAuth is now handled directly with WordPress

// Extended user type for our application - using intersection to add custom properties
type ExtendedUser = User & {
    email?: string;
    name?: string;
    token?: string;
    userId?: string; // Custom property for our app
    birthdate?: string;
    provider?: string;
}
import { UserService } from '@/services/user/userService';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { GET_RESTAURANT_USER_BY_FIREBASE_UUID } from '@/app/graphql/RestaurantUsers/restaurantUsersQueries';
import { authenticationFailed, googleAuthenticationFailed, loginFailed, logInSuccessfull } from "@/constants/messages";
import { responseStatusCode as code, sessionProvider, sessionType } from "@/constants/response";
import { HOME, ONBOARDING_ONE } from "@/constants/pages";
import { PAGE } from "@/lib/utils";

const userService = new UserService();
const cookieConfig = { path: '/', sameSite: 'lax' as const };

const setCookies = async (entries: Record<string, string>) => {
    const cookieStore = await cookies();
    Object.entries(entries).forEach(([key, value]) =>
        cookieStore.set(key, value, cookieConfig)
    );
    return cookieStore;
};

// Helper function to extract token and userId from user object
// Unified approach for both Credentials and Google OAuth providers
// Both now use JWT Auth plugin, so token extraction is the same
const extractAuthData = (
    user: User | ExtendedUser,
    account: Account | null
): { token: string | undefined; userId: string | undefined } => {
    const extendedUser = user as ExtendedUser;
    const provider = account?.provider || 'unknown';

    // Extract token - check multiple locations
    const userToken = extendedUser.token || 
                     (user as any).token || 
                     (user as any).accessToken;

    // Extract userId - check multiple locations and formats
    const userId = extendedUser.userId || 
                   extendedUser.id || 
                   (user as any).userId || 
                   (user as any).id ||
                   (user as any).sub;

    // Convert to string if it's a number
    const userIdString = userId ? String(userId) : undefined;

    if (!userToken) {
        console.error('JWT: No token found after extraction', {
            provider,
            hasExtendedUserToken: !!extendedUser.token,
            hasUserToken: !!(user as any).token,
            hasAccessToken: !!(user as any).accessToken,
            userKeys: Object.keys(user || {})
        });
    }

    if (!userIdString) {
        console.warn('JWT: No userId found after extraction', {
            provider,
            hasExtendedUserId: !!extendedUser.userId,
            hasExtendedUserid: !!extendedUser.id,
            hasUserUserId: !!(user as any).userId,
            hasUserId: !!(user as any).id,
            hasSub: !!(user as any).sub,
            userKeys: Object.keys(user || {})
        });
    }

    return { token: userToken, userId: userIdString };
};

// Helper function to fetch and map user data consistently
const fetchAndMapUserData = async (
    accessToken: string,
    token: any,
    account: Account | null
): Promise<void> => {
    const provider = account?.provider || 'unknown';
    
    // Preserve existing user ID before attempting to fetch (critical for session to work)
    const existingUserId = (token.user as Record<string, unknown>)?.userId || 
                          (token.user as Record<string, unknown>)?.id || 
                          token.sub || 
                          token.id;
    
    try {
        // Fix 3: Improved logging to verify token usage
        console.log('JWT: Fetching user data', {
            provider,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length,
            tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none',
            existingUserId: existingUserId ? String(existingUserId) : undefined,
            tokenSub: token.sub,
            tokenId: token.id
        });
        
        const userData = await userService.getCurrentUser(accessToken);
        if (userData) {
            const userId = String(userData.ID || userData.id || existingUserId);
            
            // Set user ID consistently - use fetched ID or preserve existing
            const finalUserId = userData.ID || userData.id || existingUserId;
            (token.user as Record<string, unknown>).userId = finalUserId;
            (token.user as Record<string, unknown>).id = finalUserId;
            token.sub = String(finalUserId);
            token.id = String(finalUserId);
            
            console.log('JWT: User data fetched successfully', {
                provider,
                userId: finalUserId,
                hasProfileImage: !!userData.profile_image,
                hasDisplayName: !!userData.display_name
            });
            
            // Map user profile data
            if (userData.profile_image) {
                (token.user as Record<string, unknown>).image = userData.profile_image;
            }
            if (userData.palates) {
                (token.user as Record<string, unknown>).palates = userData.palates;
            }
            if (userData.about_me) {
                (token.user as Record<string, unknown>).about_me = userData.about_me;
            }
            if (userData.display_name) {
                (token.user as Record<string, unknown>).name = userData.display_name;
            }
        } else {
            console.warn('JWT: User data fetch returned null/undefined, preserving existing user ID', {
                provider,
                hasToken: !!accessToken,
                existingUserId: existingUserId ? String(existingUserId) : undefined
            });
            // Ensure user ID is preserved even if fetch fails
            if (existingUserId) {
                (token.user as Record<string, unknown>).userId = existingUserId;
                (token.user as Record<string, unknown>).id = existingUserId;
                token.sub = String(existingUserId);
                token.id = String(existingUserId);
            }
        }
    } catch (error) {
        console.error('JWT: Error fetching user data, preserving existing user ID', {
            error: error instanceof Error ? error.message : String(error),
            provider,
            hasToken: !!accessToken,
            existingUserId: existingUserId ? String(existingUserId) : undefined,
            errorStack: error instanceof Error ? error.stack : undefined
        });
        
        // CRITICAL: Preserve user ID even if API call fails
        // This ensures session still works even if getCurrentUser endpoint has issues
        if (existingUserId) {
            (token.user as Record<string, unknown>).userId = existingUserId;
            (token.user as Record<string, unknown>).id = existingUserId;
            token.sub = String(existingUserId);
            token.id = String(existingUserId);
            console.log('JWT: Preserved existing user ID after error', {
                provider,
                userId: existingUserId
            });
        }
        // Don't throw - fallback to existing data
    }
};

export const authOptions: AuthOptions = {
    providers: [
        // Removed GoogleProvider - OAuth is now handled directly with WordPress
        // Frontend uses Google Identity Services to get ID token, then calls WordPress OAuth endpoint
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                firebase_uuid: { label: "Firebase UID", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials) return null;
                const email = credentials?.email;
                const password = credentials?.password;
                const firebase_uuid = credentials?.firebase_uuid;
                
                try {
                    // Firebase authentication path (new)
                    if (firebase_uuid) {
                        console.log('[NextAuth] Attempting to authorize with firebase_uuid:', firebase_uuid);
                        
                        // Fetch user from Hasura using firebase_uuid (server-side GraphQL query)
                        let hasuraUser = null;
                        try {
                            const result = await hasuraQuery(GET_RESTAURANT_USER_BY_FIREBASE_UUID, { firebase_uuid });
                            
                            if (result.errors) {
                                console.error('[NextAuth] GraphQL errors fetching user:', result.errors);
                            } else {
                                const users = result.data?.restaurant_users || [];
                                hasuraUser = users[0] || null;
                                console.log('[NextAuth] First attempt result:', {
                                    hasData: !!hasuraUser,
                                    userId: hasuraUser?.id,
                                    email: hasuraUser?.email
                                });
                            }
                        } catch (error: any) {
                            console.error('[NextAuth] Error fetching user from Hasura (first attempt):', {
                                error: error.message,
                                firebase_uuid
                            });
                        }
                        
                        // If user not found, retry once (in case of race condition)
                        if (!hasuraUser) {
                            console.log('[NextAuth] User not found in Hasura, retrying after 1 second...', firebase_uuid);
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                            
                            try {
                                const retryResult = await hasuraQuery(GET_RESTAURANT_USER_BY_FIREBASE_UUID, { firebase_uuid });
                                
                                if (retryResult.errors) {
                                    console.error('[NextAuth] GraphQL errors on retry:', retryResult.errors);
                                } else {
                                    const users = retryResult.data?.restaurant_users || [];
                                    hasuraUser = users[0] || null;
                                    console.log('[NextAuth] Retry attempt result:', {
                                        hasData: !!hasuraUser,
                                        userId: hasuraUser?.id,
                                        email: hasuraUser?.email
                                    });
                                }
                            } catch (retryError: any) {
                                console.error('[NextAuth] Error fetching user from Hasura (retry attempt):', {
                                    error: retryError.message,
                                    firebase_uuid
                                });
                            }
                        }
                        
                        if (hasuraUser) {
                            console.log('[NextAuth] User found, creating session:', {
                                id: hasuraUser.id,
                                email: hasuraUser.email,
                                username: hasuraUser.username
                            });
                            await setCookies({ logInMessage: logInSuccessfull });
                            
                            // Return user data for NextAuth session
                            // Note: We don't have a JWT token from Hasura yet, so we'll use firebase_uuid as identifier
                            // In the future, you might want to generate a custom token or use Hasura JWT
                            return {
                                id: hasuraUser.id,
                                userId: hasuraUser.id,
                                name: hasuraUser.display_name || hasuraUser.username,
                                email: hasuraUser.email,
                                firebase_uuid: hasuraUser.firebase_uuid,
                                onboarding_complete: hasuraUser.onboarding_complete || false,
                                token: null, // TODO: Generate custom token if needed for Hasura permissions
                            };
                        }
                        
                        // User doesn't exist in Hasura - this shouldn't happen if Firebase auth worked
                        // But we'll return null to let the frontend handle it
                        console.error('[NextAuth] Firebase user authenticated but not found in Hasura after retry:', {
                            firebase_uuid
                        });
                        
                        // Set error cookie for frontend to read
                        await setCookies({
                            googleErrorType: sessionType.login,
                            googleError: encodeURIComponent('User account not found in database. Please try registering again.'),
                        });
                        return null;
                    }
                    
                    // All authentication now goes through Firebase
                    // If no firebase_uuid is provided, authentication fails
                    if (!firebase_uuid) {
                        console.error('[NextAuth] No firebase_uuid provided. Authentication requires Firebase.');
                        await setCookies({
                            googleErrorType: sessionType.login,
                            googleError: encodeURIComponent('Authentication failed. Please try again.'),
                        });
                        return null;
                    }
                    
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    // Extract error message properly
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    await setCookies({
                        googleErrorType: sessionType.login,
                        googleError: encodeURIComponent(errorMessage || loginFailed),
                    });
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        // Removed signIn callback - no longer needed since OAuth is handled directly with WordPress
        // OAuth flow: Frontend -> Google Identity Services -> WordPress OAuth endpoint -> NextAuth session
        // Manual login flow: Frontend -> WordPress unified endpoint -> NextAuth session
        // Both flows now go through authorize() callback with JWT tokens from WordPress
        async jwt({ token, user, account, trigger, session }) {
            const provider = account?.provider || 'unknown';
            
            if (user) {
                const extendedUser = user as ExtendedUser;
                
                console.log('JWT: Processing JWT callback', {
                    provider,
                    trigger,
                    hasUser: !!user,
                    hasEmail: !!extendedUser.email
                });
                
                // Unified token extraction for both providers (no cookies needed)
                const { token: userToken, userId } = extractAuthData(user, account);
                
                // Determine user ID - use extracted userId or fallback to user object properties
                const finalUserId = userId || extendedUser.userId || extendedUser.id || (user as any).userId || (user as any).id;
                
                // Extract email and name - unified structure for both providers
                // Both manual login and Google OAuth now set: { id, userId, name, email, token }
                const userEmail = extendedUser.email || (user as any).email || undefined;
                const userName = extendedUser.name || (user as any).name || undefined;
                
                // Set token user structure consistently - CRITICAL: Set id and userId immediately
                token.user = {
                    ...user,
                    provider: account?.provider || sessionProvider.credentials,
                    userId: finalUserId ? (typeof finalUserId === 'string' ? parseInt(finalUserId, 10) : finalUserId) : undefined,
                    id: finalUserId ? (typeof finalUserId === 'string' ? parseInt(finalUserId, 10) : finalUserId) : undefined,
                    // Explicitly preserve email from user object or user_email (Solution 1 & 2)
                    email: userEmail,
                    // Also preserve name for consistency
                    name: userName,
                };
                token.accessToken = userToken;
                
                // Store email directly in token for redundancy (Solution 1)
                if (userEmail) {
                    (token as any).email = userEmail;
                }
                
                // Ensure token has an id/sub for middleware to recognize it
                if (!token.sub && !token.id) {
                    if (finalUserId) {
                        const tokenId = String(finalUserId);
                        token.sub = tokenId;
                        token.id = tokenId;
                        console.log('JWT: Set token sub/id from initial auth data', { tokenId, provider });
                    } else {
                        console.warn('JWT: No token ID available for sub/id', { provider });
                    }
                }

                // Fetch user data if we have a token
                // Fix 1: getCurrentUser only needs JWT token, not email
                // Email is nice-to-have for logging but not required for API call
                if (token.accessToken) {
                    // We can fetch user details with just the token
                    // getCurrentUser endpoint validates the token and returns user data
                    await fetchAndMapUserData(token.accessToken as string, token, account);
                } else {
                    console.warn('JWT: No access token available for user data fetch', { 
                        provider,
                        hasUserId: !!finalUserId,
                        hasEmail: !!(token.user as any)?.email || !!userEmail
                    });
                }
                
                // Log final state to help debug
                console.log('JWT: Token user structure after processing', {
                    provider,
                    hasUserId: !!(token.user as any)?.userId,
                    hasId: !!(token.user as any)?.id,
                    userId: (token.user as any)?.userId,
                    id: (token.user as any)?.id,
                    hasAccessToken: !!token.accessToken,
                    hasEmail: !!(token.user as any)?.email
                });
            } else if (trigger === 'update') {
                console.log('JWT: Update trigger without user object', { trigger });
            }

            // Handle updates to user data
            if (trigger === "update" && session?.user) {
                token.user = {
                    ...(typeof token.user === 'object' && token.user !== null ? token.user : {}),
                    image: session.user.image,
                    about_me: session.user.about_me,
                    palates: session.user.palates,
                    birthdate: session.user.birthdate,
                    email: session.user.email,
                    language: session.user.language,
                }
            }

            // CRITICAL: Always return token, even if empty, so middleware can check it
            // Ensure token is truthy for middleware authorization
            return token;
        },
        async session({ session, token }) {
            if (token) {
                const tokenUser = token.user as Record<string, unknown> | undefined;
                
                if (tokenUser) {
                    // Map token user to session user
                    // Unified structure: both providers now have { id, userId, name, email, token, image }
                    // Fallbacks only for edge cases
                    const sessionEmail = tokenUser.email || (token as any).email || null;
                    const sessionName = tokenUser.name || null;
                    const sessionImage = tokenUser.image || null;
                    
                    session.user = {
                        ...tokenUser,
                        id: tokenUser.id || tokenUser.userId || null,
                        userId: tokenUser.userId || tokenUser.id || null,
                        email: sessionEmail,
                        name: sessionName,
                        image: sessionImage, // Explicitly include image for profile display
                        onboarding_complete: tokenUser.onboarding_complete || false,
                    } as typeof session.user;
                } else {
                    // Fix 2: Fallback - if tokenUser is missing, try to get email and id from token
                    // This ensures session has both email and user ID for authentication
                    session.user = {
                        ...session.user,
                        email: (token as any).email || null,
                        id: token.sub || token.id || null,
                        userId: token.sub || token.id || null,
                        image: (token as any).image || null, // Include image in fallback
                    } as typeof session.user;
                }
                
                session.accessToken = token.accessToken as string | undefined;
            }
            
            return session;
        },
    },
    pages: {
        signIn: HOME,
        signOut: HOME, // suppress /api/auth/signout
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
