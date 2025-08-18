import type { Metadata } from "next";
import "@/styles/global.scss";
import SessionWrapper from "@/components/SessionWrapper";
import { Toaster } from 'react-hot-toast';
import { FollowProvider } from "@/components/FollowContext";
import InactivityLogout from "@/components/InactivityLogout";
export const metadata: Metadata = {
  title: "TastyPlates",
  description: "Tasty Plates",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" reverseOrder={false} />
        <FollowProvider>
          <SessionWrapper><InactivityLogout />{children}</SessionWrapper>
        </FollowProvider>
      </body>
    </html>
  );
}
