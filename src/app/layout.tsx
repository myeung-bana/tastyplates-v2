import type { Metadata } from "next";
import "@/styles/global.scss";
import SessionWrapper from "@/components/SessionWrapper";
import { Toaster } from 'react-hot-toast';
import { FollowProvider } from "@/components/FollowContext";
import InactivityLogout from "@/components/InactivityLogout";
import BottomNav from "@/components/BottomNav";
import AuthModalWrapper from "@/components/AuthModalWrapper";
import Footer from "@/components/Footer";
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
          <SessionWrapper>
            <InactivityLogout />
            <AuthModalWrapper>
              <div className="min-h-screen bg-white flex flex-col">
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <BottomNav />
              </div>
            </AuthModalWrapper>
          </SessionWrapper>
        </FollowProvider>
      </body>
    </html>
  );
}
