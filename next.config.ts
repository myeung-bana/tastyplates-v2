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
      "localhost",
      "secure.gravatar.com",
       "www.tastyplates.co",
    ],
  },
  env: {
    WORDPRESS_API_URL: process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL
  },
};

export default nextConfig;
