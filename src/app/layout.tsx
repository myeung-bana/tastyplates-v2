import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/global.scss";
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: "TastyPlates",
  description: "Tasty Plates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
