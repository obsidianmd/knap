import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://knap.md'),
  title: { default: 'Knap · The templating language for Markdown', template: '%s · Knap' },
  description: 'Knap is a safe, flexible template language for turning structured data into Markdown.',
  openGraph: {
    title: 'Knap · The templating language for Markdown',
    description: 'Variables, logic, loops, and filters for applications that create Markdown.',
    type: 'website',
    url: 'https://knap.md',
  },
  twitter: {
    card: 'summary',
    title: 'Knap · The templating language for Markdown',
    description: 'Variables, logic, loops, and filters for applications that create Markdown.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
