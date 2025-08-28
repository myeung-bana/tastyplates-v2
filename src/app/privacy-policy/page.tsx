// app/privacy-policy/page.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Fetch from your WordPress API
async function getPrivacyPolicy() {
  const baseUrl = process.env.NEXT_PUBLIC_WP_API_URL;

  const res = await fetch(`${baseUrl}/wp-json/v1/privacy-policy`, {
    next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Privacy Policy");
  }

  return res.json();
}

export default async function PrivacyPolicy() {
  const data = await getPrivacyPolicy();

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-xl w-full">
            {data.title || "Privacy Policy"}
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-xl">
            <section>
              <div
                className="prose prose-xs max-w-none text-[#31343F]"
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
