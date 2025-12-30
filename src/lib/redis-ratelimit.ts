import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./upstash-redis"

// Different rate limiters for different use cases

// Upload endpoints (strict to protect cost)
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
  analytics: true,
  prefix: "ratelimit:upload",
})

// Like/comment endpoints (moderate)
export const likeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"), // 20 per 10 seconds
  analytics: true,
  prefix: "ratelimit:like",
})

// Create review/comment endpoints (strict to prevent spam)
export const createRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30 s"), // 5 per 30 seconds
  analytics: true,
  prefix: "ratelimit:create",
})

// Follow/unfollow endpoints
export const followRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 per 10 seconds
  analytics: true,
  prefix: "ratelimit:follow",
})

// Wishlist/checkin endpoints
export const wishlistRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "10 s"), // 15 per 10 seconds
  analytics: true,
  prefix: "ratelimit:wishlist",
})

// Generic rate limiter (default)
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
})

export async function rateLimitOrThrow(key: string, limiter: Ratelimit = ratelimit) {
  try {
    const result = await limiter.limit(key)
    if (!result.success) {
      const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
      const error = new Error("Rate limit exceeded")
      ;(error as any).status = 429
      ;(error as any).retryAfter = retryAfter
      return { ok: false as const, retryAfter }
    }
    return { ok: true as const }
  } catch (error) {
    console.error(`⚠️ Rate limit error for key ${key}:`, error)
    // If rate limiting fails, allow the request through
    return { ok: true as const }
  }
}

