import type { MetadataRoute } from 'next';
import { brand } from '@/lib/campus/brand';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.subtitle.nl,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: brand.theme.background,
    theme_color: brand.theme.primary,
    lang: 'nl',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
