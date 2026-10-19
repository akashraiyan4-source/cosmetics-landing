/**
 * Resilient JSON client for the Universal Backend.
 *
 *  • NEVER throws – always resolves to an `ApiResult`, so callers need no try/catch to stay safe.
 *  • Understands the backend contract `{ success, data?, error?, requestId }` and the legacy shape
 *    (top-level `reply`, `appointment`, …) used by older deployments.
 *  • Hard timeout (AbortController) so a stalled network can never leave a spinner running forever.
 *  • Safe automatic retries (network error, timeout, 429, 502/503/504, in-flight 409) with exponential
 *    backoff + jitter – only for GETs, requests carrying an `Idempotency-Key`, or when `retries` is explicit.
 *  • `Idempotency-Key` support so retries and double-clicks can never create duplicate bookings.
 */

export interface ApiResult<T = unknown> {
  /** True when the HTTP status is 2xx and the backend reported `success !== false`. */
  ok: boolean;
  status: number;
  /** Unwrapped payload (`response.data`, or the legacy top-level body). `null` on failure. */
  data: T | null;
  /** Human-readable message when `ok` is false. */
  error: string | null;
  /** True when no HTTP response was received at all (offline, DNS, CORS, timeout). */
  networkError: boolean;
  requestId?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Reuse the same key for every retry of ONE logical submission. See `createIdempotencyKey()`. */
  idempotencyKey?: string;
  timeoutMs?: number;
  /** Extra attempts after the first. Defaults to 2 for GET / idempotent requests, otherwise 0. */
  retries?: number;
  signal?: AbortSignal;
}

const RETRYABLE_STATUS = new Set([409, 429, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 5_000;

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function backoffDelay(attempt: number, retryAfterHeader: string | null): number {
  const retryAfter = Number(retryAfterHeader);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, MAX_RETRY_DELAY_MS);
  return Math.min(400 * 2 ** attempt + Math.random() * 250, MAX_RETRY_DELAY_MS);
}

function friendlyError(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const { error, message } = payload as { error?: unknown; message?: unknown };
    if (typeof error === 'string' && error.trim()) return error;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 408 || status === 504) return 'The request timed out. Please try again.';
  if (status >= 500) return 'Our server is busy right now. Please try again shortly.';
  return 'Something went wrong';
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T = Record<string, unknown>>(url: string, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  const method = options.method ?? 'POST';
  const canRetry = method === 'GET' || Boolean(options.idempotencyKey);
  const maxRetries = Math.max(0, options.retries ?? (canRetry ? 2 : 0));
  const timeoutMs = options.timeoutMs ?? 15_000;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  let serialized: string | undefined;
  try {
    serialized = options.body === undefined ? undefined : JSON.stringify(options.body);
  } catch {
    return { ok: false, status: 0, data: null, error: 'Invalid request data.', networkError: false };
  }

  let last: ApiResult<T> = { ok: false, status: 0, data: null, error: 'Server connection failed.', networkError: true };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const response = await fetch(url, { method, headers, body: serialized, signal: controller.signal, cache: 'no-store' });
      const payload = await readJson(response);
      const envelope = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
      const success = response.ok && envelope?.success !== false;

      last = {
        ok: success,
        status: response.status,
        data: success ? ((envelope && 'data' in envelope ? envelope.data : envelope) as T | null) : null,
        error: success ? null : friendlyError(response.status, payload),
        networkError: false,
        requestId: typeof envelope?.requestId === 'string' ? envelope.requestId : undefined,
      };

      const retryAfterHeader = response.headers.get('Retry-After');
      const retryable =
        RETRYABLE_STATUS.has(response.status) && (response.status !== 409 || (Number(retryAfterHeader) > 0 && Number(retryAfterHeader) <= 5));

      if (success || !retryable || attempt === maxRetries) return last;
      await sleep(backoffDelay(attempt, retryAfterHeader));
    } catch {
      if (options.signal?.aborted) {
        return { ok: false, status: 0, data: null, error: 'Request cancelled.', networkError: true };
      }
      last = { ok: false, status: 0, data: null, error: 'Server connection failed.', networkError: true };
      if (attempt === maxRetries) return last;
      await sleep(backoffDelay(attempt, null));
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    }
  }

  return last;
}

/** Unwrap a string field from either `data.field` or the top-level envelope. */
export function readReply(data: unknown, keys: string[] = ['reply', 'message', 'response']): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}
