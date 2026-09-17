import type { NextConfig } from 'next';

function backendApiBase(): string {
  const raw = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Set BACKEND_URL or NEXT_PUBLIC_API_URL so Next.js can proxy /api to the Express server');
    }
    return 'http://localhost:5000/api';
  }
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiBase()}/:path*`,
      },
    ];
  },
};

export default nextConfig;
