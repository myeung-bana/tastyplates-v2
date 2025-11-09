import NextAuth from "next-auth";
import { authOptions } from "../authOptions";

const handler = NextAuth(authOptions);

// Export handlers with proper error handling
export async function GET(...args: Parameters<typeof handler>) {
  try {
    return await handler(...args);
  } catch (error) {
    console.error("[NextAuth] GET error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Authentication error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(...args: Parameters<typeof handler>) {
  try {
    return await handler(...args);
  } catch (error) {
    console.error("[NextAuth] POST error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Authentication error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
