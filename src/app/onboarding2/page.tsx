import Footer from "@/components/Footer"
import OnboardingTwoPage from "@/pages/Register/OnboardingTwo"

const OnboardingPage = () => {
  return (
    <>
      <div className="flex items-center justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full flex flex-col gap-8 items-center">
          <OnboardingTwoPage />
        </main>
      </div>
      <Footer isShowLinks={false} />
    </>
  )
}

export default OnboardingPage