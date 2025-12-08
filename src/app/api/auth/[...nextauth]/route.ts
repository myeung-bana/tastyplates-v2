import NextAuth from "next-auth";
import { authOptions } from "../authOptions";

const handler = NextAuth(authOptions);

// Export handlers using the standard NextAuth pattern for App Router
export { handler as GET, handler as POST };
