import Form from "@/components/Profile/Form";
import { Suspense } from "react";

function ProfileEditFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div
        className="h-12 w-12 animate-spin rounded-full border-2 border-[#ff7c0a] border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 text-center text-sm text-gray-600 font-neusans">
        Loading profile editor…
      </p>
    </div>
  );
}

const ProfileEditPage = () => {
  return (
    <Suspense fallback={<ProfileEditFallback />}>
      <section>
        <Form />
      </section>
    </Suspense>
  );
};

export default ProfileEditPage;
