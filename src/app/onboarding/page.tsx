"use client";
import { Suspense, useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import OnboardingStepOne from "@/components/onboarding/OnboardingStepOne";
import OnboardingStepTwo from "@/components/onboarding/OnboardingStepTwo";
import { useRouter, useSearchParams } from "next/navigation";
import { HOME, ONBOARDING_ONE } from "@/constants/pages";
import { REGISTRATION_KEY } from "@/constants/session";
import Cookies from "js-cookie";
import { signIn, useSession } from "next-auth/react";
import { sessionProvider as provider } from "@/constants/response";

// Component that uses useSearchParams - must be wrapped in Suspense
const OnboardingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);

  // Dev mode: Allow direct step access via query param (e.g., ?step=2)
  useEffect(() => {
    setHasMounted(true);
    if (searchParams) {
      const stepParam = searchParams.get('step');
      if (stepParam && process.env.NODE_ENV === 'development') {
        const step = parseInt(stepParam, 10);
        if (step === 1 || step === 2) {
          setCurrentStep(step);
        }
      }
    }
  }, [searchParams]);

  // Check for registration data and handle session-based onboarding check
  const { data: session } = useSession();
  
  useEffect(() => {
    if (!hasMounted) return;
    
    // Check if user is logged in with new Firebase method
    if (session?.user?.id) {
      // If onboarding is already complete, redirect to home
      if (session.user.onboarding_complete === true) {
        router.replace(HOME);
        return;
      }
      // If user is logged in but onboarding not complete, allow access
      return;
    }
    
    // Legacy support: Check for registration data from old flows
    const storedData = localStorage.getItem(REGISTRATION_KEY);
    const googleAuth = Cookies.get('googleAuth');
    const email = Cookies.get('email');
    const username = Cookies.get('username');
    
    // Handle legacy Google auth flow (from cookies)
    if (!storedData && googleAuth === 'true') {
      const registrationData = {
        username: username || "",
        email: email || "",
        password: "",
        googleAuth: true
      };
      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrationData));
      return;
    }

    // Allow OAuth users who have been auto-registered (they have storedData with googleAuth: true)
    // Only redirect to HOME if there's no registration data and it's not a Google auth flow
    const parsedData = storedData ? JSON.parse(storedData) : {};
    const isOAuthUser = parsedData.googleAuth || parsedData.is_google_user;
    const isPartialRegistration = parsedData.isPartialRegistration;
    
    // Allow access if it's a partial registration (user needs to complete profile)
    if (!storedData && googleAuth !== 'true' && !isOAuthUser && !isPartialRegistration) {
      router.replace(HOME);
    }
  }, [router, hasMounted, session]);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      // Update URL for dev mode
      if (process.env.NODE_ENV === 'development') {
        router.push(`/onboarding?step=${currentStep + 1}`, { scroll: false });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Update URL for dev mode
      if (process.env.NODE_ENV === 'development') {
        router.push(`/onboarding?step=${currentStep - 1}`, { scroll: false });
      }
    }
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full flex justify-center py-8 pt-20">
        <div className="w-full">
          {currentStep === 1 && (
            <OnboardingStepOne onNext={handleNext} currentStep={currentStep} />
          )}
          {currentStep === 2 && (
            <OnboardingStepTwo onPrevious={handlePrevious} currentStep={currentStep} />
          )}
        </div>
      </main>
      {/* Dev Mode Step Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-50 shadow-lg">
          <div className="mb-2 font-semibold">Dev Mode</div>
          <div className="mb-2">Step: {currentStep} of 2</div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setCurrentStep(1);
                router.push('/onboarding?step=1', { scroll: false });
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Step 1
            </button>
            <button 
              onClick={() => {
                setCurrentStep(2);
                router.push('/onboarding?step=2', { scroll: false });
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Step 2
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const OnboardingPage = () => {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Suspense fallback={<div className="flex flex-col min-h-screen"><Navbar /><main className="flex-1 w-full flex justify-center py-8 pt-20"><div className="w-full">Loading...</div></main></div>}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
};

export default OnboardingPage;
