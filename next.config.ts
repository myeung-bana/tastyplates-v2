import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  sassOptions: {
    includePaths: ["./src/styles"],
    prependData: `@import "base/variables";`,
  },

  images: {
    domains: [
      "wordpress.test",
      process.env.NEXT_PUBLIC_WP_API_URL || "",
      "localhost",
      "secure.gravatar.com"
    ],
  },
  env: {
    WORDPRESS_API_URL: process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL
  },
};

export default nextConfig;
