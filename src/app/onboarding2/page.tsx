import Footer from "@/components/layout/Footer"
import OnboardingTwoPage from "@/pages/Register/OnboardingTwo"
import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

const OnboardingPage = () => {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Suspense fallback={<div></div>}>
        <Navbar />
        <main className="flex-1 w-full flex justify-center py-8 pt-20">
          <OnboardingTwoPage />
        </main>
        <Footer isShowLinks={false} />
      </Suspense>
    </div>
  );
}

export default OnboardingPage