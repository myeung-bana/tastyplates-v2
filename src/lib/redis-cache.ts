import { redis } from "./upstash-redis"

export async function cacheGetOrSetJSON<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<{ value: T; hit: boolean }> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null && cached !== undefined) {
      console.log(`✅ Cache HIT: ${key}`)
      return { value: cached, hit: true }
    }

    console.log(`❌ Cache MISS: ${key}`)
    const value = await fn()
    await redis.set(key, value, { ex: ttlSeconds })
    return { value, hit: false }
  } catch (error) {
    console.error(`⚠️ Redis cache error for key ${key}:`, error)
    // Fallback to executing the function if Redis fails
    const value = await fn()
    return { value, hit: false }
  }
}

export async function cacheInvalidate(key: string): Promise<void> {
  try {
    await redis.del(key)
    console.log(`🗑️ Cache invalidated: ${key}`)
  } catch (error) {
    console.error(`⚠️ Redis cache invalidation error for key ${key}:`, error)
  }
}

