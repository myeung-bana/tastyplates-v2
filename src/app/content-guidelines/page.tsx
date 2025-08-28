// app/content-guidelines/page.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Fetch from your WordPress API
async function getContentGuidelines() {
  const baseUrl = process.env.NEXT_PUBLIC_WP_API_URL;

  const res = await fetch(`${baseUrl}/wp-json/v1/content-guidelines`, {
    next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Content Guidelines");
  }

  return res.json();
}

export default async function ContentGuidelines() {
  const data = await getContentGuidelines();

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col justify-between bg-white gap-[12px]">
        <div className="pt-24 px-4 flex justify-center">
          <h1 className="text-[32px] font-bold text-center text-[#31343F] mb-8 max-w-xl w-full">
            {data.title || "Content Guidelines"}
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
