import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TeamCal - Google Calendar\'s Missing Schedule View',
  description: 'Enhance Google Calendar with team scheduling and planning functionalities. Perfect for managing staff rotations, on-call duty times and team vacations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
