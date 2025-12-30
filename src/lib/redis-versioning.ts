import { redis } from "./upstash-redis"

export async function getVersion(key: string): Promise<number> {
  try {
    const v = await redis.get<number>(key)
    return typeof v === "number" ? v : 0
  } catch (error) {
    console.error(`⚠️ Redis getVersion error for key ${key}:`, error)
    return 0
  }
}

export async function bumpVersion(key: string): Promise<number> {
  try {
    // INCR creates the key if missing
    const newVersion = await redis.incr(key)
    console.log(`🔄 Bumped version ${key}: ${newVersion}`)
    return newVersion
  } catch (error) {
    console.error(`⚠️ Redis bumpVersion error for key ${key}:`, error)
    return 0
  }
}

