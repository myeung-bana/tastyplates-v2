/**
 * Shared wrapper for /articles/* — route groups add their own Navbar variants.
 */
export default function ArticlesRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section className="font-neusans">{children}</section>;
}
