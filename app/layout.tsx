import type { Metadata, Viewport } from 'next';
import { brand } from '@/lib/campus/brand';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(brand.origin),
  title: {
    default: brand.name + ' · Vind je weg op campus',
    template: '%s · ' + brand.name,
  },
  description: brand.subtitle.nl,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: brand.name },
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  openGraph: {
    title: brand.name,
    description: brand.subtitle.nl,
    type: 'website',
    locale: 'nl_NL',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: brand.theme.primary,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body
        style={
          {
            '--ink': brand.theme.ink,
            '--primary': brand.theme.primary,
            '--lime': brand.theme.accent,
            '--canvas': brand.theme.background,
          } as React.CSSProperties
        }
      >
        <a className="skip" href="#main">
          Naar inhoud / Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
