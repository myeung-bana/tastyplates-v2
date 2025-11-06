import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import OnboardingOnePage from "@/pages/Register/OnboardingOne";
import Navbar from "@/components/layout/Navbar";

const OnboardingPage = () => {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Suspense fallback={<div></div>}>
        <main className="flex-1 w-full flex justify-center py-8 pt-20">
          <div className="w-full">
            <Navbar />
            <OnboardingOnePage />
          </div>
        </main>
        </Suspense>
      <div className="mt-auto">
        <Footer isShowLinks={false} />
      </div>
    </div>
  );
};

export default OnboardingPage;
