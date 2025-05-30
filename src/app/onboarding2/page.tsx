import Footer from "@/components/Footer"
import OnboardingTwoPage from "@/pages/Register/OnboardingTwo"

const OnboardingPage = () => {
  return (
    <>
      <div className="min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full">
          <OnboardingTwoPage />
        </main>
      </div>
      <Footer isShowLinks={false} />
    </>
  )
}

export default OnboardingPage