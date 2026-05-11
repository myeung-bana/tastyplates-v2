'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function UptimeRefreshButton() {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 font-neusans text-sm font-semibold text-[#31343F] transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {pending ? 'Checking…' : 'Re-run checks'}
    </button>
  )
}
