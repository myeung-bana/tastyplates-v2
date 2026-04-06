/**
 * Suspense fallback for the homepage: white screen, circular icon + loading.io–style ring.
 */
export default function HomePageLoadingFallback() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-white"
      aria-busy
      aria-label="Loading"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-4 border-[#ff7c0a]/15 border-t-[#ff7c0a] motion-safe:animate-spin"
          style={{ animationDuration: "0.85s" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- static public asset in Suspense fallback */}
        <img
          src="/icons/Favicon_Orange_Circle.png"
          alt=""
          width={56}
          height={56}
          className="relative h-14 w-14 object-contain"
        />
      </div>
    </div>
  );
}
