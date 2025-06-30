import Form from "@/components/Profile/Form";
import { Suspense } from "react";

const ProfileEditPage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"></div>}>
      <section>
        <Form />
      </section>
    </Suspense>
  );
};

export default ProfileEditPage;
