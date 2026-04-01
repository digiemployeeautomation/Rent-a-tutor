/** @type {import('next').NextConfig} */

// Replace YOUR_PROJECT_ID with your actual Supabase project reference
// (the subdomain part of your project URL, e.g. "abcdefghijklmnop")
const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?.replace('https://', '')
  .split('.')[0] ?? ''

const nextConfig = {
  images: {
    remotePatterns: [
      // Scoped to your specific Supabase project — not all *.supabase.co
      ...(SUPABASE_PROJECT_ID ? [{
        protocol: 'https',
        hostname: `${SUPABASE_PROJECT_ID}.supabase.co`,
        pathname: '/storage/v1/object/public/**',
      }] : []),
      // Fallback during local dev when env var isn't set
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
