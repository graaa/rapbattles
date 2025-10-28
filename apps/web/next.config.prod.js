/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@rapbattles/core', '@rapbattles/ui'],
}

module.exports = nextConfig
