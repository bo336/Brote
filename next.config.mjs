import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  register: false, // registered manually by components/pwa/ServiceWorker
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/offline.html', revision: '1' }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The 3D world and image-heavy surfaces benefit from modern formats.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  // three / @react-three ship ESM that Next transpiles fine, but keep these
  // packages optimized for the App Router.
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/drei', 'recharts'],
  },
  /**
   * /explorar split into /feed (the Plaza) and /proyectos. These are permanent
   * because the old paths are already out in the world — in the PWA's cached
   * shell, in shared news links, and in push notifications sent before the
   * move. A 404 for someone tapping an old notification is a lost session.
   */
  async redirects() {
    return [
      { source: '/explorar', destination: '/feed', permanent: true },
      { source: '/explorar/novedades/:id', destination: '/feed/n/:id', permanent: true },
      { source: '/explorar/proyectos', destination: '/acciones?tab=proyectos', permanent: true },
      { source: '/explorar/proyectos/:path*', destination: '/proyectos/:path*', permanent: true },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));
