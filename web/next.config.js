/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['kqxnjpyupcxbajuzsbtx.supabase.co'],
    unoptimized: true, // Para desarrollo local
  },
}

module.exports = nextConfig

