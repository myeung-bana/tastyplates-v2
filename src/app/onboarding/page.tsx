import Footer from "@/components/Footer"
import OnboardingOnePage from "@/pages/Register/OnboardingOne"

const OnboardingPage = () => {
  return (
    <>
      <div className="min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full">
          <OnboardingOnePage />
        </main>
      </div>
      <Footer isShowLinks={false} />
    </>
  )
}

export default OnboardingPage