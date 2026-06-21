/**
 * Webhook event store — Vercel KV + in-memory fallback.
 *
 * When KV_REST_API_URL + KV_REST_API_TOKEN are set (Vercel deployment),
 * events are stored in Redis via @vercel/kv and survive across serverless
 * function invocations.
 *
 * When those vars are absent (local dev), an in-memory array is used
 * instead — behaviour is identical within a single process.
 *
 * All exported functions are async so callers work the same in both modes.
 */

const MAX_EVENTS = 100;
const KV_KEY     = "whop:webhook:events";
const KV_TTL     = 86_400; // 24 hours (seconds)

// ── In-memory fallback ────────────────────────────────────────────────────────
/** @type {Array} newest-first */
const _mem = [];

/** @type {Map<string, Function>} SSE subscribers for local dev */
const _subscribers = new Map();

// ── Redis availability ────────────────────────────────────────────────────────
// Supports both Upstash env var names (UPSTASH_REDIS_REST_*) and the legacy
// Vercel KV names (KV_REST_API_*) — whichever the integration provides.
function _redisUrl()   { return process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL; }
function _redisToken() { return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN; }
function _kvConfigured() { return !!(  _redisUrl() && _redisToken()); }

/** Lazily instantiate the Redis client only when env vars are present. */
let _redisClient = null;
async function _kv() {
  if (_redisClient) return _redisClient;
  const { Redis } = await import("@upstash/redis");
  _redisClient = new Redis({ url: _redisUrl(), token: _redisToken() });
  return _redisClient;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Store a new webhook event.
 * @param {string}  type
 * @param {object}  data
 * @param {boolean} verified
 * @param {object}  [headers]
 * @returns {Promise<object>} the stored record
 */
export async function addEvent(type, data, verified, headers = {}) {
  const record = {
    id:         `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    receivedAt: new Date().toISOString(),
    type,
    data,
    verified,
    rawHeaders: {
      "webhook-id":           headers["webhook-id"]           ?? null,
      "webhook-timestamp":    headers["webhook-timestamp"]    ?? null,
      "webhook-signature":    headers["webhook-signature"]    ?? null,
      "x-whop-signature-256": headers["x-whop-signature-256"] ?? null,
    },
  };

  if (_kvConfigured()) {
    // ── KV path ──────────────────────────────────────────────────────────────
    try {
      const db = await _kv();
      // lpush prepends (newest first); ltrim keeps only MAX_EVENTS entries
      await db.lpush(KV_KEY, record);
      await db.ltrim(KV_KEY, 0, MAX_EVENTS - 1);
      await db.expire(KV_KEY, KV_TTL);
    } catch (err) {
      console.error("[webhook/store] KV write failed, falling back to memory:", err.message);
      _memAdd(record);
    }
  } else {
    // ── In-memory path ────────────────────────────────────────────────────────
    _memAdd(record);
    _broadcast({ action: "new", record });
  }

  return record;
}

/**
 * Return all stored events, newest first.
 * @returns {Promise<Array>}
 */
export async function getEvents() {
  if (_kvConfigured()) {
    try {
      const db     = await _kv();
      const items  = await db.lrange(KV_KEY, 0, -1);
      // @vercel/kv auto-parses JSON; plain objects come back directly
      return items.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item,
      );
    } catch (err) {
      console.error("[webhook/store] KV read failed:", err.message);
      return [..._mem];
    }
  }
  return [..._mem];
}

/**
 * Clear all stored events.
 * @returns {Promise<void>}
 */
export async function clearEvents() {
  if (_kvConfigured()) {
    try {
      const db = await _kv();
      await db.del(KV_KEY);
    } catch (err) {
      console.error("[webhook/store] KV clear failed:", err.message);
    }
  } else {
    _mem.length = 0;
    _broadcast({ action: "clear" });
  }
}

// ── SSE support (local dev / in-memory mode only) ─────────────────────────────

/**
 * Register an SSE subscriber (only used in local / in-memory mode).
 * @param {string}   id
 * @param {Function} sendFn
 * @returns {Function} unsubscribe
 */
export function subscribe(id, sendFn) {
  _subscribers.set(id, sendFn);
  return () => _subscribers.delete(id);
}

// ── Internals ─────────────────────────────────────────────────────────────────

function _memAdd(record) {
  _mem.unshift(record);
  if (_mem.length > MAX_EVENTS) _mem.pop();
}

function _broadcast(payload) {
  for (const [id, sendFn] of _subscribers) {
    try {
      sendFn(payload);
    } catch {
      _subscribers.delete(id);
    }
  }
}
