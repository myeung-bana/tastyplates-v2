import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user?: {
            id?: number | null;
            userId?: number | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            birthdate?: string | null;
            provider?: string | null;
        };
        accessToken?: string;
    }
    
    interface User {
        userId: number;
        token?: string;
        birthdate?: string;
        provider?: string;
    }
}
