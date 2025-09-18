import { AuthOptions, User, Account } from "next-auth";
import { cookies } from "next/headers";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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
                        const res = await userService.handleGoogleAuth(email);
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
                    const res = await userService.login({ email, password });
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
        async signIn(params: { user: User; account: Account | null }) {
            const { user, account } = params;
            let type: string | null = null;

            try {
                const cookieStore = await cookies();
                type = cookieStore.get('auth_type')?.value || null;

                if (account?.provider === sessionProvider.google) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { email = "", name = "" } = user as any;

                    if (type === sessionType.signup) {
                        // set the cookie to be use in the onboarding page
                        await setCookies({
                            googleAuth: "true",
                            email,
                            username: name,
                        });

                        const { status, exists, message } = await userService.checkEmailExists(email);
                        if (status === code.badRequest || exists) {
                            await setCookies({
                                googleErrorType: sessionType.signup,
                                googleError: encodeURIComponent(message as string),
                            });
                            return HOME;
                        }

                        return ONBOARDING_ONE;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const res = await userService.handleGoogleAuth((user as any).email || "");
                    if (res.status !== code.success) {
                        await setCookies({
                            googleErrorType: sessionType.login,
                            googleError: encodeURIComponent(res.message || googleAuthenticationFailed),
                        });
                        return HOME;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (user as any).token = res.token;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (user as any).userId = res.id?.toString();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (user as any).birthdate = '';
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (user as any).provider = sessionProvider.google;
                    await setCookies({ logInMessage: logInSuccessfull });
                    return true;
                }
            } catch {
                return PAGE(HOME, [], { error: authenticationFailed });
            }

            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (user) {
                const extendedUser = user as ExtendedUser;
                token.user = {
                    ...user,
                    provider: account?.provider || sessionProvider.credentials,
                    userId: extendedUser.userId || extendedUser.id // Handle both Google and credentials cases
                };
                token.accessToken = extendedUser.token;

                if (extendedUser.email && token.accessToken) {
                    try {
                        const userData = await userService.getCurrentUser(token.accessToken as string);
                        if (userData) {
                            (token.user as Record<string, unknown>).userId = userData.ID || userData.id;
                            (token.user as Record<string, unknown>).id = userData.ID || userData.id;
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
                session.user = token.user as Record<string, unknown>;
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
