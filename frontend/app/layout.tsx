import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripWise AI — Smart Travel Planner',
  description: 'AI-powered travel recommendations based on your location, budget and time',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}