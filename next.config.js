/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost',  "www.tastyplates.co"],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/a/**',
            },
            {
                protocol: 'https',
                hostname: 'secure.gravatar.com',
                pathname: '/avatar/**',
            }
        ],
    },
}

module.exports = nextConfig
