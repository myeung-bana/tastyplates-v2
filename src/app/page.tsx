import Image from "next/image";
import Hero from "@/components/Hero";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="grid items-center justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="!w-full flex flex-col gap-8 items-center sm:items-start">
          <Hero />
          <Reviews />
        </main>
      </div>
      <Footer />
    </>
  );
}
