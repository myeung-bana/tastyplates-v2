/**
 * Server-side probes for /uptime — Nhost Functions, Nhost Auth healthz, optional Hasura.
 * No secrets; safe to call from a Server Component or Route Handler.
 */

const FETCH_MS = 12_000

export type ProbeStatus = 'ok' | 'error' | 'skipped'

export type ProbeResult = {
  name: string
  description: string
  status: ProbeStatus
  latencyMs: number | null
  message?: string
  /** Public URL path only (no query secrets) */
  path?: string
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return '/graphql'
  }
}

export function resolveNhostFunctionsUrl(relativePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL?.trim()
  if (!base) return null
  const clean = base.replace(/\/+$/, '')
  const rel = relativePath.replace(/^\/+/, '')
  return `${clean}/${rel}`
}

/** Public liveness for Nhost Auth (Hasura Auth) — no session. */
export function resolveNhostAuthHealthUrl(): string | null {
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN?.trim()
  const region = process.env.NEXT_PUBLIC_NHOST_REGION?.trim()
  if (!subdomain || !region) return null
  return `https://${subdomain}.auth.${region}.nhost.run/healthz`
}

async function probeHttpOk(
  name: string,
  description: string,
  url: string,
  path: string,
): Promise<ProbeResult> {
  const t0 = performance.now()
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_MS),
      headers: { Accept: '*/*' },
    })
    const latencyMs = msSince(t0)
    if (!res.ok) {
      return {
        name,
        description,
        status: 'error',
        latencyMs,
        path,
        message: `HTTP ${res.status} ${res.statusText}`,
      }
    }
    return {
      name,
      description,
      status: 'ok',
      latencyMs,
      path,
      message: `HTTP ${res.status}`,
    }
  } catch (e) {
    return {
      name,
      description,
      status: 'error',
      latencyMs: msSince(t0),
      path,
      message: e instanceof Error ? e.message : 'Request failed',
    }
  }
}

function msSince(start: number): number {
  return Math.round(performance.now() - start)
}

async function probeJson(
  name: string,
  description: string,
  url: string,
  path: string,
  init?: RequestInit,
  isOk?: (json: unknown) => boolean,
): Promise<ProbeResult> {
  const t0 = performance.now()
  try {
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_MS),
    })
    const latencyMs = msSince(t0)
    const text = await res.text()
    let json: unknown
    try {
      json = JSON.parse(text) as unknown
    } catch {
      return {
        name,
        description,
        status: 'error',
        latencyMs,
        path,
        message: `HTTP ${res.status} — response was not JSON`,
      }
    }

    const defaultOk =
      res.ok &&
      typeof json === 'object' &&
      json !== null &&
      'ok' in json &&
      (json as { ok: unknown }).ok === true

    const ok = isOk ? isOk(json) : defaultOk

    if (!ok) {
      const err =
        typeof json === 'object' && json !== null && 'error' in json
          ? String((json as { error: unknown }).error)
          : `HTTP ${res.status}`
      return {
        name,
        description,
        status: 'error',
        latencyMs,
        path,
        message: err || 'Unexpected response',
      }
    }

    return {
      name,
      description,
      status: 'ok',
      latencyMs,
      path,
      message: `HTTP ${res.status}`,
    }
  } catch (e) {
    return {
      name,
      description,
      status: 'error',
      latencyMs: msSince(t0),
      path,
      message: e instanceof Error ? e.message : 'Request failed',
    }
  }
}

export async function runUptimeChecks(): Promise<{
  checkedAt: string
  probes: ProbeResult[]
  functionsBaseConfigured: boolean
  nhostAuthConfigured: boolean
  hasuraUrlConfigured: boolean
}> {
  const checkedAt = new Date().toISOString()
  const probes: ProbeResult[] = []

  const healthUrl = resolveNhostFunctionsUrl('health')
  const categoriesUrl = resolveNhostFunctionsUrl('categories/get-categories?limit=1')
  const authHealthUrl = resolveNhostAuthHealthUrl()
  const functionsBaseConfigured = Boolean(healthUrl)
  const nhostAuthConfigured = Boolean(authHealthUrl)

  if (healthUrl) {
    probes.push(
      await probeJson(
        'Nhost Functions — health',
        'Liveness of the Functions runtime (no database work).',
        healthUrl,
        'health',
        { method: 'GET', headers: { Accept: 'application/json' } },
        (json) => {
          if (
            typeof json !== 'object' ||
            json === null ||
            (json as { ok?: unknown }).ok !== true ||
            typeof (json as { data?: unknown }).data !== 'object' ||
            (json as { data: { status?: unknown } }).data === null
          ) {
            return false
          }
          const data = (json as { data: { status?: string } }).data
          return data.status === 'ok'
        },
      ),
    )
  } else {
    probes.push({
      name: 'Nhost Functions — health',
      description: 'Liveness of the Functions runtime.',
      status: 'skipped',
      latencyMs: null,
      message:
        'Set NEXT_PUBLIC_NHOST_FUNCTIONS_URL (e.g. https://SUBDOMAIN.functions.REGION.nhost.run/v1)',
    })
  }

  if (categoriesUrl) {
    probes.push(
      await probeJson(
        'Nhost Functions → Hasura',
        'Public read through Functions (validates admin GraphQL path on the server).',
        categoriesUrl,
        'categories/get-categories?limit=1',
        { method: 'GET', headers: { Accept: 'application/json' } },
        (json) => {
          if (
            typeof json !== 'object' ||
            json === null ||
            (json as { ok?: unknown }).ok !== true
          ) {
            return false
          }
          const data = (json as { data?: { categories?: unknown } }).data
          return Array.isArray(data?.categories)
        },
      ),
    )
  } else {
    probes.push({
      name: 'Nhost Functions → Hasura',
      description: 'Public categories read via Functions.',
      status: 'skipped',
      latencyMs: null,
      message: 'Same as health — configure NEXT_PUBLIC_NHOST_FUNCTIONS_URL',
    })
  }

  if (authHealthUrl) {
    probes.push(
      await probeHttpOk(
        'Nhost Auth — healthz',
        'Public health endpoint on the auth service (no tokens, no /v1/token).',
        authHealthUrl,
        '/healthz',
      ),
    )
  } else {
    probes.push({
      name: 'Nhost Auth — healthz',
      description: 'Public auth service liveness.',
      status: 'skipped',
      latencyMs: null,
      message: 'Set NEXT_PUBLIC_NHOST_SUBDOMAIN and NEXT_PUBLIC_NHOST_REGION',
    })
  }

  const hasuraUrl = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL?.trim()
  const hasuraUrlConfigured = Boolean(hasuraUrl)

  if (hasuraUrl) {
    const t0 = performance.now()
    try {
      const res = await fetch(hasuraUrl, {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_MS),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: 'query UptimeProbe { __typename }' }),
      })
      const latencyMs = msSince(t0)
      const json = (await res.json()) as {
        data?: { __typename?: string }
        errors?: Array<{ message?: string }>
      }
      if (!res.ok || json.errors?.length) {
        probes.push({
          name: 'Hasura GraphQL',
          description: 'Direct GraphQL endpoint (anonymous probe).',
          status: 'error',
          latencyMs,
          path: safePathname(hasuraUrl),
          message: json.errors?.[0]?.message || `HTTP ${res.status}`,
        })
      } else if (json.data != null && typeof json.data === 'object') {
        probes.push({
          name: 'Hasura GraphQL',
          description: 'Direct GraphQL endpoint (anonymous probe).',
          status: 'ok',
          latencyMs,
          path: safePathname(hasuraUrl),
          message: `HTTP ${res.status}`,
        })
      } else {
        probes.push({
          name: 'Hasura GraphQL',
          description: 'Direct GraphQL endpoint (anonymous probe).',
          status: 'error',
          latencyMs,
          path: safePathname(hasuraUrl),
          message: 'Unexpected GraphQL response shape',
        })
      }
    } catch (e) {
      probes.push({
        name: 'Hasura GraphQL',
        description: 'Direct GraphQL endpoint (anonymous probe).',
        status: 'error',
        latencyMs: msSince(t0),
        path: safePathname(hasuraUrl),
        message: e instanceof Error ? e.message : 'Request failed',
      })
    }
  } else {
    probes.push({
      name: 'Hasura GraphQL',
      description: 'Direct GraphQL endpoint (optional).',
      status: 'skipped',
      latencyMs: null,
      message: 'Set NEXT_PUBLIC_HASURA_GRAPHQL_API_URL to enable this probe',
    })
  }

  return {
    checkedAt,
    probes,
    functionsBaseConfigured,
    nhostAuthConfigured,
    hasuraUrlConfigured,
  }
}
