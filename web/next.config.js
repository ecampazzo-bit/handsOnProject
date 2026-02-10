/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimizaciones para desarrollo
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Reducir el monitoreo de archivos en desarrollo
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reducir el polling de archivos en desarrollo
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
  // Configuración de Turbopack (vacía para evitar conflictos)
  // Usamos webpack explícitamente con --webpack flag
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kqxnjpyupcxbajuzsbtx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: true, // Para desarrollo local
  },
  async headers() {
    // Solo aplicar headers de cache en producción
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://kqxnjpyupcxbajuzsbtx.supabase.co",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' https://kqxnjpyupcxbajuzsbtx.supabase.co https://*.supabase.co wss://*.supabase.co",
                "frame-src 'self' https://kqxnjpyupcxbajuzsbtx.supabase.co",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests",
              ].join('; '),
            },
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate, max-age=0',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    }
    // En desarrollo, solo CSP
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://kqxnjpyupcxbajuzsbtx.supabase.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://kqxnjpyupcxbajuzsbtx.supabase.co https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self' https://kqxnjpyupcxbajuzsbtx.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

