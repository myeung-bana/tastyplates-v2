import { AuthOptions } from "next-auth";
import { cookies } from "next/headers";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { UserService } from '@/services/userService';
import { authenticationFailed, googleAuthenticationFailed, loginFailed, logInSuccessfull } from "@/constants/messages";
import { responseStatusCode as code, sessionProvider, sessionType } from "@/constants/response";
import { HOME, ONBOARDING_ONE } from "@/constants/pages";
import { PAGE } from "@/lib/utils";

const cookieConfig = { path: '/', sameSite: 'lax' as const }

const setCookies = async (entries: Record<string, string>) => {
    const cookieStore = await cookies();
    Object.entries(entries).forEach(([key, value]) =>
        cookieStore.set(key, value, cookieConfig)
    );
    return cookieStore;
};

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
                params: {
                    prompt: "select_account",
                    hl: "en",
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
                const email = credentials?.email;
                const password = credentials?.password;
                const googleAuth = cookieStore.get("googleAuth")?.value == "true";
                try {
                    // Handle google-register auto login
                    if (!password && googleAuth) {
                        const res = await UserService.handleGoogleAuth(email);
                        if (res.status == code.success) {
                            await setCookies({ logInMessage: logInSuccessfull });
                            return {
                                id: String(res.id) ?? "",
                                userId: res.id ?? 0,
                                name: email,
                                email,
                                token: res.token,
                            };
                        } else {
                            await setCookies({
                                googleErrorType: sessionType.login,
                                googleError: encodeURIComponent(res.message || googleAuthenticationFailed),
                            });
                            return null;
                        }
                    }
                    const res = await UserService.login({ email, password });
                    if (res.token) {
                        await setCookies({ logInMessage: logInSuccessfull });
                        return {
                            id: String(res.id) ?? "",
                            userId: res.id ?? 0,
                            name: res.user_display_name,
                            email: res.user_email,
                            token: res.token,
                        };
                    }

                    await setCookies({
                        googleErrorType: sessionType.login,
                        googleError: loginFailed,
                    });
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    await setCookies({
                        googleErrorType: sessionType.login,
                        googleError: String(error),
                    });
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
                let cookieStore = await cookies();
                type = cookieStore.get('auth_type')?.value || null;

                if (account?.provider === sessionProvider.google) {
                    const { email = "", name = "" } = user;

                    if (type === sessionType.signup) {
                        // set the cookie to be use in the onboarding page
                        await setCookies({
                            googleAuth: "true",
                            email,
                            username: name,
                        });

                        const { status, exists, message } = await UserService.checkEmailExists(email);
                        if (status === code.badRequest || exists) {
                            await setCookies({
                                googleErrorType: sessionType.signup,
                                googleError: encodeURIComponent(message),
                            });
                            return HOME;
                        }

                        return ONBOARDING_ONE;
                    }

                    const res = await UserService.handleGoogleAuth(user.email);
                    if (res.status !== code.success) {
                        await setCookies({
                            googleErrorType: sessionType.login,
                            googleError: encodeURIComponent(res.message || googleAuthenticationFailed),
                        });
                        return HOME;
                    }

                    user.token = res.token;
                    user.userId = res.id;
                    user.birthdate = '';
                    user.provider = sessionProvider.google;
                    await setCookies({ logInMessage: logInSuccessfull });
                    return true;
                }
            } catch (error) {
                return PAGE(HOME, [], { error: authenticationFailed });
            }

            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (user) {
                token.user = {
                    ...user,
                    provider: account?.provider || sessionProvider.credentials,
                    userId: user.userId || user.id // Handle both Google and credentials cases
                };
                token.accessToken = user.token;

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

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = token.user as any;
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
