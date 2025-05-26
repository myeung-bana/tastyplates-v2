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
    ],
  },
  env: {
    WORDPRESS_API_URL: "https://wordpress.test/graphql",
  },
};

export default nextConfig;
