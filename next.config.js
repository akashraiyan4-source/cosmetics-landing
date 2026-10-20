/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';
const DEFAULT_BACKEND_URL = 'https://smileway-backend.vercel.app';

function resolveBackend() {
  const candidate = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim() || DEFAULT_BACKEND_URL;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('unsupported protocol');
    return { value: url.origin + url.pathname.replace(/\/+$/, ''), origin: url.origin };
  } catch {
    console.warn(`[next.config] Invalid NEXT_PUBLIC_BACKEND_URL "${candidate}" - using ${DEFAULT_BACKEND_URL}`);
    return { value: DEFAULT_BACKEND_URL, origin: DEFAULT_BACKEND_URL };
  }
}

const backend = resolveBackend();

function contentSecurityPolicy() {
  const connect = ["'self'", backend.origin];
  if (!isProd) connect.push('ws://localhost:*', 'http://localhost:*', 'ws://127.0.0.1:*', 'http://127.0.0.1:*');

  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(isProd ? [] : ["'unsafe-eval'"])],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'media-src': ["'self'", 'blob:', 'data:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': connect,
    'frame-src': ['https://maps.google.com', 'https://www.google.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (isProd) policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BACKEND_URL: backend.value },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backend.value}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/niches/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

module.exports = nextConfig;