import type { Metadata } from "next";
import "@/styles/global.scss";
import SessionWrapper from "@/components/auth/SessionWrapper";
import { Toaster } from 'react-hot-toast';
import { FollowProvider } from "@/components/FollowContext";
import { LocationProvider } from "@/contexts/LocationContext";
import InactivityLogout from "@/components/common/InactivityLogout";
import OAuthCallbackHandler from "@/components/auth/OAuthCallbackHandler";
import OnboardingRedirect from "@/components/auth/OnboardingRedirect";
import BottomNav from "@/components/layout/BottomNav";
import MobileTopBar from "@/components/layout/MobileTopBar";
import AuthModalWrapper from "@/components/auth/AuthModalWrapper";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import { LanguageProvider } from '@/contexts/LanguageContext';
import { UploadProvider } from '@/contexts/UploadContext';
import { generateMetadata as generateSEOMetadata, siteConfig, generateStructuredData } from "@/lib/seo";
import Script from "next/script";

// Enhanced root metadata for SEO
export const metadata: Metadata = generateSEOMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  canonical: siteConfig.url,
  image: siteConfig.ogImage,
  type: "website",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate structured data for organization and website
  const organizationData = generateStructuredData({ type: "Organization" });
  const websiteData = generateStructuredData({ type: "WebSite" });

  return (
    <html lang="en">
      <body>
        {/* Organization Structured Data - Search engines will read this from body */}
        {organizationData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
          />
        )}
        {/* Website Structured Data - Search engines will read this from body */}
        {websiteData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
          />
        )}
        {/* Bing Clarity Analytics - Add your project ID */}
        {process.env.NEXT_PUBLIC_BING_CLARITY_ID && (
          <Script
            id="bing-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_BING_CLARITY_ID}");
              `,
            }}
          />
        )}
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
        <UploadProvider>
          <FollowProvider>
            <LocationProvider>
              <SessionWrapper>
                <OAuthCallbackHandler />
                <OnboardingRedirect />
                <LanguageProvider>
                  <InactivityLogout />
                  <AuthModalWrapper>
                    <div className="min-h-screen bg-white flex flex-col">
                      <MobileTopBar />
                      <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0">
                        {children}
                      </main>
                      <ConditionalFooter />
                      <BottomNav />
                    </div>
                  </AuthModalWrapper>
                </LanguageProvider>
              </SessionWrapper>
            </LocationProvider>
          </FollowProvider>
        </UploadProvider>
      </body>
    </html>
  );
}
