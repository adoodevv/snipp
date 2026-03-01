/**
 * Simple in-memory rate limiter.
 * For production at scale, consider Upstash Redis or Vercel KV.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_AI = 30; // 30 AI requests per minute per identifier
const MAX_REQUESTS_SAVE = 20; // 20 saves per minute per identifier

function getIdentifier(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    return ip;
}

function checkLimit(
    identifier: string,
    maxRequests: number
): { allowed: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now();
    const key = identifier;
    const entry = store.get(key);

    if (!entry) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    if (now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    entry.count += 1;
    const remaining = Math.max(0, maxRequests - entry.count);
    const allowed = entry.count <= maxRequests;

    return {
        allowed,
        remaining,
        retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
    };
}

export function rateLimitAI(request: Request): { allowed: boolean; remaining: number; retryAfter?: number } {
    return checkLimit(getIdentifier(request), MAX_REQUESTS_AI);
}

export function rateLimitSave(request: Request): { allowed: boolean; remaining: number; retryAfter?: number } {
    return checkLimit(getIdentifier(request), MAX_REQUESTS_SAVE);
}
