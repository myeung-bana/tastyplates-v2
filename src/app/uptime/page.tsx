import type { Metadata } from 'next'
import UptimeRefreshButton from '@/components/uptime/UptimeRefreshButton'
import { runUptimeChecks, type ProbeResult } from '@/lib/uptimeChecks'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'System status',
  description: 'Tastyplates connectivity checks for Nhost Functions and GraphQL.',
  robots: { index: false, follow: false },
}

function StatusBadge({ status }: { status: ProbeResult['status'] }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-neusans text-xs font-semibold text-emerald-800">
        OK
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 font-neusans text-xs font-semibold text-amber-900">
        Skipped
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 font-neusans text-xs font-semibold text-red-800">
      Error
    </span>
  )
}

export default async function UptimePage() {
  const { checkedAt, probes, functionsBaseConfigured, nhostAuthConfigured, hasuraUrlConfigured } =
    await runUptimeChecks()

  const formatted = new Date(checkedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

  return (
    <main className="pb-16 pt-6 font-inter text-[#31343F] md:pt-8">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-neusans text-2xl font-semibold tracking-tight text-[#31343F] md:text-3xl">
                System status
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Live checks from this server (not your browser). Last run: {formatted}
              </p>
            </div>
            <UptimeRefreshButton />
          </div>

          <p className="mb-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4 text-sm leading-relaxed text-gray-600">
            This route uses a <strong className="text-[#31343F]">minimal layout</strong> (no Nhost client), so opening it does{' '}
            <strong className="text-[#31343F]">not</strong> call <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">/v1/token</code> — useful for monitoring and debugging session noise. Probes run on the server. Before migrating traffic, confirm{' '}
            <strong className="text-[#31343F]">Functions health</strong>, at least one{' '}
            <strong className="text-[#31343F]">public read</strong>, your{' '}
            <strong className="text-[#31343F]">auth healthz</strong>, and that private endpoints return{' '}
            <strong className="text-[#31343F]">401/403 as expected</strong>. Configure{' '}
            <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">NEXT_PUBLIC_NHOST_FUNCTIONS_URL</code>{' '}
            to match your Nhost dashboard (include the version segment once, e.g.{' '}
            <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">/v1</code> or{' '}
            <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">/v0</code>).
          </p>

          <ul className="mb-6 flex flex-wrap gap-3 text-xs text-gray-500">
            <li>
              Functions URL:{' '}
              {functionsBaseConfigured ? (
                <span className="font-medium text-emerald-700">configured</span>
              ) : (
                <span className="font-medium text-amber-800">missing</span>
              )}
            </li>
            <li>
              Nhost Auth (subdomain/region):{' '}
              {nhostAuthConfigured ? (
                <span className="font-medium text-emerald-700">configured</span>
              ) : (
                <span className="font-medium text-amber-800">missing</span>
              )}
            </li>
            <li>
              Hasura URL:{' '}
              {hasuraUrlConfigured ? (
                <span className="font-medium text-emerald-700">configured</span>
              ) : (
                <span className="font-medium text-gray-500">optional</span>
              )}
            </li>
          </ul>

          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 font-neusans font-semibold text-[#31343F]">Check</th>
                  <th className="hidden px-4 py-3 font-neusans font-semibold text-[#31343F] sm:table-cell">
                    Path
                  </th>
                  <th className="px-4 py-3 font-neusans font-semibold text-[#31343F]">Status</th>
                  <th className="px-4 py-3 text-right font-neusans font-semibold text-[#31343F]">
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {probes.map((p) => (
                  <tr key={p.name} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-4 align-top">
                      <div className="font-neusans font-semibold text-[#31343F]">{p.name}</div>
                      <div className="mt-1 text-xs leading-snug text-gray-500">{p.description}</div>
                      {p.message ? (
                        <div
                          className={`mt-2 font-mono text-xs ${
                            p.status === 'ok' ? 'text-gray-600' : 'text-red-700'
                          }`}
                        >
                          {p.message}
                        </div>
                      ) : null}
                    </td>
                    <td className="hidden max-w-[200px] px-4 py-4 align-top sm:table-cell">
                      {p.path ? (
                        <code className="break-all text-xs text-gray-600">{p.path}</code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-4 text-right align-top font-mono text-xs text-gray-700">
                      {p.latencyMs != null ? `${p.latencyMs} ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  )
}
