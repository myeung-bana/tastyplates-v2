import type { Metadata } from "next";
import "@/styles/global.scss";
import SessionWrapper from "@/components/SessionWrapper";
import { FollowProvider } from "@/components/FollowContext";
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
        <FollowProvider>
          <SessionWrapper>{children}</SessionWrapper>
        </FollowProvider>
      </body>
    </html>
  );
}
