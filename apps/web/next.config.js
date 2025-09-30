/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rapbattles/core', '@rapbattles/ui'],
  output: 'standalone',
}

module.exports = nextConfig
