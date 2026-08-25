import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://knap.md'),
  title: { default: 'Knap — A template engine for Markdown', template: '%s — Knap' },
  description: 'Knap is a safe, flexible template engine for turning structured data into Markdown.',
  openGraph: {
    title: 'Knap — A template engine for Markdown',
    description: 'Variables, logic, loops, and filters for applications that create Markdown.',
    type: 'website',
    url: 'https://knap.md',
  },
  twitter: {
    card: 'summary',
    title: 'Knap — A template engine for Markdown',
    description: 'Variables, logic, loops, and filters for applications that create Markdown.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
