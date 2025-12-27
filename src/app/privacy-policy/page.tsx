import Navbar from "@/components/layout/Navbar";
import { PrivacyPolicyService } from "@/services/PrivacyPolicy/privacyPolicyService";

const privacyPolicyService = new PrivacyPolicyService();

// Force dynamic rendering since we're using cache: "no-store"
export const dynamic = 'force-dynamic';

async function getPrivacyPolicy() {
  return privacyPolicyService.getPrivacyPolicy();
}

export default async function PrivacyPolicy() {
  const data = await getPrivacyPolicy();

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="font-neusans text-[32px] font-normal text-center text-[#31343F] mb-8 max-w-xl w-full">
            {data.title || "Privacy Policy"}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <section>
              <div
                className="font-neusans prose prose-xs max-w-none text-[#31343F] text-justify"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
