import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
        <Navbar hasSearchBar={true} />
        {children}
      <Footer />
    </section>
  );
}