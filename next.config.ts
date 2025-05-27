import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  sassOptions: {
    includePaths: ["./src/styles"],
    prependData: `@import "base/variables";`,
  },

  images: {
    domains: [
      // Add your WordPress domain
      "wordpress.test",
      "localhost",
      "secure.gravatar.com"
    ],
  },
  env: {
    NEXT_PUBLIC_WP_GRAPHQL_API_URL: "http://wordpress.test/graphql",
  },
};

export default nextConfig;