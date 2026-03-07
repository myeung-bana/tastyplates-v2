// This file is kept only to satisfy any lingering Pages Router resolution.
// The actual component lives at src/components/auth/UpdatePasswordForm.tsx
// and is rendered via src/app/reset-password/page.tsx (App Router).
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function UpdatePasswordRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reset-password");
  }, [router]);
  return null;
}
