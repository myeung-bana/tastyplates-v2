import Navbar from "@/components/layout/Navbar";
import { loadMarkdownContent } from "@/utils/markdownLoader";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TermsOfService() {
  const data = await loadMarkdownContent('terms-of-service');

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="font-neusans text-[32px] font-normal text-center text-[#31343F] mb-8 max-w-xl w-full">
            {data.title}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <section>
              <div
                className="legal-content text-justify"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}