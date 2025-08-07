import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import UpdatePassword from "@/pages/Login/UpdatePassword";

const ResetPasswordPage = () => {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Suspense fallback={<div></div>}>
        <Navbar />
        <main className="flex-1 w-full flex justify-center py-8 pt-20">
          <UpdatePassword />
        </main>
        <Footer isShowLinks={false} />
      </Suspense>
    </div>
  );
}

export default ResetPasswordPage