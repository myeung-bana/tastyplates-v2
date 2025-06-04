import Footer from "@/components/Footer"
import OnboardingTwoPage from "@/pages/Register/OnboardingTwo"
import Navbar from "@/components/Navbar";

const OnboardingPage = () => {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <main className="flex-1 w-full flex justify-center py-8 pt-20">
        <OnboardingTwoPage />
      </main>
      <Footer isShowLinks={false} />
    </div>
  );
}

export default OnboardingPage