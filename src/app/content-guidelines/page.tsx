"use client";
import { Suspense, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ContentGuidelinesService } from "@/services/ContentGuidelines/contentGuidelinesService";

const contentGuidelinesService = new ContentGuidelinesService();

export default function ContentGuidelines() {
  const [guidelines, setGuidelines] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔹 First read cache synchronously on mount
  useEffect(() => {
    const cached = localStorage.getItem("guidelines");
    const expiry = localStorage.getItem("guidelinesExpiry");

    if (cached && expiry && Date.now() < parseInt(expiry)) {
      setGuidelines(JSON.parse(cached));
    }

    async function fetchGuidelines() {
      try {
        const data = await contentGuidelinesService.getContentGuidelines();
        const newData = { title: data.title, content: data.content };

        localStorage.setItem("guidelines", JSON.stringify(newData));
        localStorage.setItem("guidelinesExpiry", (Date.now() + 5 * 60 * 1000).toString());

        setGuidelines(newData);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    }

    fetchGuidelines();
  }, []);

  return (
    <>
      <Suspense fallback={<div></div>}>
        <Navbar />
      </Suspense>
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-xl w-full">
            {guidelines?.title || "Content Guidelines"}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <div className="text-[#31343F] flex flex-col gap-3 p-0">
              {error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : guidelines ? (
                <section>
                  <div
                    className="prose prose-xs max-w-none text-[#31343F]"
                    dangerouslySetInnerHTML={{ __html: guidelines.content }}
                  />
                </section>
              ) : null}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
