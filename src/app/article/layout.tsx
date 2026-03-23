/**
 * Legacy /article/[id] only redirects to /articles/[slug] — no extra chrome.
 */
export default function ArticleLegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
