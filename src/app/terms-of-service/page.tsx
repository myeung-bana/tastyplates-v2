"use client";
import { Suspense, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TermsOfServiceService } from "@/services/TermsOfService/termsOfServiceService";

const termsOfServiceService = new TermsOfServiceService();

export default function TermsOfService() {
  const [terms, setTerms] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("termsOfService");
    const expiry = localStorage.getItem("termsOfServiceExpiry");

    if (cached && expiry && Date.now() < parseInt(expiry)) {
      setTerms(JSON.parse(cached));
    }

    async function fetchTerms() {
      try {
        const data = await termsOfServiceService.getTermsOfService();
        const newData = { title: data.title, content: data.content };

        localStorage.setItem("termsOfService", JSON.stringify(newData));
        localStorage.setItem("termsOfServiceExpiry", (Date.now() + 5 * 60 * 1000).toString());

        setTerms(newData);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    }

    fetchTerms();
  }, []);

  return (
    <>
      <Suspense fallback={<div></div>}>
        <Navbar />
      </Suspense>
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-xl w-full">
            {terms?.title || "Terms of Service"}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <div className="text-[#31343F] flex flex-col gap-3 p-0">
              {error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : terms ? (
                <section>
                  <div
                    className="prose prose-xs max-w-none text-[#31343F]"
                    dangerouslySetInnerHTML={{ __html: terms.content }}
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
