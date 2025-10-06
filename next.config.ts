import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Add TypeScript configuration for Vercel deployment
  typescript: {
    // Ignore TypeScript errors during build (temporary fix)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build (temporary fix)
    ignoreDuringBuilds: true,
  },
  sassOptions: {
    includePaths: ["./src/styles"],
    prependData: `@import "base/variables";`,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "wordpress.test",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/avatar/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
      {
        protocol: "https",
        hostname: "www.tastyplates.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.backend.tastyplates.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backend.tastyplates.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.staging.tastyplates.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tastyplates.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tastyplates-v2-xi.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tastyplates-bucket.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },

    ],
  },
  env: {
    WORDPRESS_API_URL: process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql-proxy',
        destination: 'https://backend.tastyplates.co/graphql',
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
