import Navbar from "@/components/layout/Navbar";
import { TermsOfServiceService } from "@/services/TermsOfService/termsOfServiceService";

const termsOfServiceService = new TermsOfServiceService();

// Force dynamic rendering since we're using cache: "no-store"
export const dynamic = 'force-dynamic';

async function getTermsOfService() {
  return termsOfServiceService.getTermsOfService();
}

export default async function TermsOfService() {
  const data = await getTermsOfService();

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="font-neusans text-[32px] font-normal text-center text-[#31343F] mb-8 max-w-xl w-full">
            {(data.title as string) || "Terms of Service"}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <section>
              <div
                className="font-neusans font-normal prose prose-xs max-w-none text-[#31343F] text-justify"
                dangerouslySetInnerHTML={{ __html: data.content as string }}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}