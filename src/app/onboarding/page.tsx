import Footer from "@/components/Footer"
import OnboardingOnePage from "@/pages/Register/OnboardingOne"

const OnboardingPage = () => {
  return (
    <>
      <div className="flex items-center justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full flex flex-col gap-8 items-center">
          <OnboardingOnePage />
        </main>
      </div>
      <Footer isShowLinks={false} />
    </>
  )
}

export default OnboardingPage