import Footer from "@/components/Footer";
import OnboardingOnePage from "@/pages/Register/OnboardingOne";
import Navbar from "@/components/Navbar";

const OnboardingPage = () => {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <main className="flex-1 w-full flex justify-center py-8 pt-20">
        <div className="w-full">
          <OnboardingOnePage />
        </div>
      </main>
      <div className="mt-auto">
        <Footer isShowLinks={false} />
      </div>
    </div>
  );
};

export default OnboardingPage