import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Add TypeScript configuration for Vercel deployment
  typescript: {
    // Ignore TypeScript errors during build (temporary fix)
    ignoreBuildErrors: true,
  },
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  sassOptions: {
    includePaths: ["./src/styles"],
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
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.gstatic.com",
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
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
      {
        // SEO and security headers for all pages
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
