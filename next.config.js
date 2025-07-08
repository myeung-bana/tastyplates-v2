/** @type {import('next').NextConfig} */
const nextConfig = {
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
                hostname: "tastyplates.vercel.app",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "tastyplates-v2-xi.vercel.app/",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "tastyplates-bucket.s3.ap-northeast-2.amazonaws.com",
                pathname: "/**",
            },

        ],
    },
};

module.exports = nextConfig;
