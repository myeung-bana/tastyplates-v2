import type { Metadata } from "next";
import "@/styles/global.scss";
import SessionWrapper from "@/components/auth/SessionWrapper";
import { Toaster } from 'react-hot-toast';
import { FollowProvider } from "@/components/FollowContext";
import { LocationProvider } from "@/contexts/LocationContext";
import InactivityLogout from "@/components/common/InactivityLogout";
import BottomNav from "@/components/layout/BottomNav";
import MobileTopBar from "@/components/layout/MobileTopBar";
import AuthModalWrapper from "@/components/auth/AuthModalWrapper";
import Footer from "@/components/layout/Footer";
import { LanguageProvider } from '@/contexts/LanguageContext';
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
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 24px',
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E5E7EB',
              maxWidth: '400px',
              width: 'fit-content',
              minWidth: '200px',
            },
          }}
        />
        <FollowProvider>
          <LocationProvider>
            <SessionWrapper>
              <LanguageProvider>
                <InactivityLogout />
                <AuthModalWrapper>
                  <div className="min-h-screen bg-white flex flex-col">
                    <MobileTopBar />
                    <main className="flex-1 pt-14 md:pt-0">
                      {children}
                    </main>
                    <Footer />
                    <BottomNav />
                  </div>
                </AuthModalWrapper>
              </LanguageProvider>
            </SessionWrapper>
          </LocationProvider>
        </FollowProvider>
      </body>
    </html>
  );
}
