import type { Metadata } from "next";
import "@/styles/global.scss";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "TastyPlates",
  description: "Tasty Plates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
         <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
