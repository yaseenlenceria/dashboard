/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com', 'raw.githubusercontent.com'],
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  output: 'standalone',
}

module.exports = nextConfig