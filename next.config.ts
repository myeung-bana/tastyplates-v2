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
      "your-wordpress-site.com",
      "localhost",
    ],
  },
  env: {
    WORDPRESS_API_URL: "https://your-wordpress-site.com/graphql",
  },
};

export default nextConfig;
