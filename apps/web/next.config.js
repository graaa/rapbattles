/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@rapbattles/core', '@rapbattles/ui'],
  },
}

module.exports = nextConfig
