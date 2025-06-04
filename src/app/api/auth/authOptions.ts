import { AuthOptions, User } from "next-auth";
import { cookies } from "next/headers";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { UserRepository } from "@/repositories/userRepository";
import { UserService } from '@/services/userService';

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
                params: {
                    prompt: "select_account",
                },
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) return null;
                const cookieStore = await cookies();
                try {
                    const API_BASE_URL = process.env.NEXT_PUBLIC_WP_API_URL;
                    const res = await fetch(`${API_BASE_URL}/wp-json/jwt-auth/v1/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            username: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok && data.token) {
                        return {
                            id: data.id ?? "",
                            userId: data.id ?? 0,
                            name: data.user_display_name,
                            email: data.user_email,
                            token: data.token,
                        };
                    }
                    cookieStore.set('googleErrorType', 'login', { path: '/', sameSite: 'lax' });
                    cookieStore.set('googleError', 'Login failed. Please try again.', { path: '/', sameSite: 'lax' });
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    cookieStore.set('googleErrorType', 'login', { path: '/', sameSite: 'lax' });
                    cookieStore.set('googleError', String(error), { path: '/', sameSite: 'lax' });
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async signIn(params: any) {
            const { user, account } = params;
            let type: string | null = null;

            try {
                const cookieStore = await cookies();
                type = cookieStore.get('auth_type')?.value || null;
            } catch {}

            if (account?.provider === "google") {
                if (type === "signup") {
                    // set the cookie to be use in the onboarding page
                    const cookieStore = await cookies();
                    cookieStore.set('googleAuth', 'true', { path: '/', sameSite: 'lax' });
                    cookieStore.set('email', user.email || '', { path: '/', sameSite: 'lax' });
                    cookieStore.set('username', user.name || '', { path: '/', sameSite: 'lax' });

                    const checkEmail = await UserService.checkEmailExists(user.email);
                    if (checkEmail.status == 400 || checkEmail.exists) {
                        cookieStore.set('googleErrorType', 'signup', { path: '/', sameSite: 'lax' });
                        cookieStore.set('googleError', encodeURIComponent(checkEmail.message), { path: '/', sameSite: 'lax' });
                        return '/';
                    }

                    return '/onboarding';
                }
                try {
                    const response = await UserRepository.checkGoogleUser(user.email!) as {
                        status: number; 
                        message?: string;
                        token?: string;
                        id?: number;
                    };
                    if (response.status !== 200) {
                        const cookieStore = await cookies();
                        cookieStore.set('googleErrorType', 'login', { path: '/', sameSite: 'lax' });
                        cookieStore.set('googleError', encodeURIComponent(response.message || "Google authentication failed"), { path: '/', sameSite: 'lax' });
                        return '/';
                    }
                    user.token = response.token;
                    user.userId = response.id;
                    user.birthdate = '';
                    user.provider = 'google';
                    return true;
                } catch (error) {
                    return `/?error=Authentication failed`;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.user = {
                    ...user,
                    provider: account?.provider || 'credentials',
                    userId: user.userId || user.id // Handle both Google and credentials cases
                };
                token.accessToken = user.token;

                // Fetch and attach profile_image to user
                if (user.email && token.accessToken) {
                    try {
                        const userData = await UserService.getCurrentUser(token.accessToken as string);
                        if (userData) {
                            (token.user as any).userId = userData.ID || userData.id;
                            (token.user as any).id = userData.ID || userData.id;
                            if (userData.profile_image) {
                                (token.user as any).image = userData.profile_image;
                            }
                            if (userData.palates) {
                                (token.user as any).palates = userData.palates;
                            }
                            if (userData.about_me) {
                                (token.user as any).about_me = userData.about_me;
                            }
                        }
                    } catch {
                        // ignore error, fallback to existing data
                    }
                }
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token) {
                session.user = token.user;
                session.accessToken = token.accessToken;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
