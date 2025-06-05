import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: ["./src/styles"],
    prependData: `@import "base/variables";`,
  },
  images: {
    domains: [
      "wordpress.test",
      "localhost",
      "secure.gravatar.com",
      "www.tastyplates.co", // ✅ critical fix
    ],
  },
  env: {
    WORDPRESS_API_URL: process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL,
  },
};

export default nextConfig;
