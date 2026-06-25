import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

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
};

export default withNextIntl(nextConfig);
