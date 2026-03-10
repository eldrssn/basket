import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spring Basket - Physics Line Match Game',
  description: 'Physics Line Match Game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
