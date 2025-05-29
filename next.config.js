/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'secure.gravatar.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/a/**',
            },
        ],
    },
}

module.exports = nextConfig
