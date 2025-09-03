import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TermsOfServiceService } from "@/services/TermsOfService/termsOfServiceService";

const termsOfServiceService = new TermsOfServiceService();

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
          <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-xl w-full">
            {data.title || "Terms of Service"}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <section>
              <div
                className="prose prose-xs max-w-none text-[#31343F] text-justify"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </section>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}