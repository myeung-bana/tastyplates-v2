import Image from 'next/image'
import Link from 'next/link'
import { RESTAURANTS } from '@/constants/pages'
import { TASTYPLATES_LOGO_BLACK } from '@/constants/images'

/**
 * Minimal chrome for status page — no NhostProvider (see root layout + middleware).
 * Avoids Navbar because it depends on useNhostSession.
 */
export default function UptimeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-inter text-[#31343F]">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href={RESTAURANTS}
            className="flex items-center gap-2 font-neusans text-sm font-semibold text-[#31343F] transition-opacity hover:opacity-80"
          >
            <Image
              src={TASTYPLATES_LOGO_BLACK}
              alt="Tastyplates"
              width={120}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-gray-200 px-3 py-1.5 font-neusans text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Home
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
