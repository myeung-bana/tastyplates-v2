import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/global.scss";
import ApolloProviderWrapper from "@/components/ApolloProviderWrapper";
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
          <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
