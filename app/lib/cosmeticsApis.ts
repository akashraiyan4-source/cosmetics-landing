import { API_ENDPOINTS, cosmeticsIdentity, type ApiEndpointKey } from '../apiEndpoints';
import { apiRequest, createIdempotencyKey, readReply, type ApiResult } from './apiClient';

/**
 * Soft-warms every public backend alias so the first visitor interaction (chat, booking, estimator)
 * is not a cold DNS + TLS + serverless start. Failures are ignored: this is opportunistic, never blocking.
 */
export function prefetchBackendCatalog(): void {
  if (typeof window === 'undefined') return;
  const urls = Object.values(API_ENDPOINTS);
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  const run = () => {
    urls.forEach((url) => {
      try {
        fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-store' }).catch(() => undefined);
      } catch {
        /* ignore */
      }
    });
  };
  if (typeof idle === 'function') idle(run, { timeout: 2500 });
  else setTimeout(run, 1200);
}

export function cosmeticsPayload(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...cosmeticsIdentity, ...extra };
}

export async function callCosmeticsApi<T = Record<string, unknown>>(
  key: ApiEndpointKey,
  extra: Record<string, unknown> = {},
  options: { timeoutMs?: number; retries?: number; idempotent?: boolean; method?: 'GET' | 'POST' } = {}
): Promise<ApiResult<T>> {
  return apiRequest<T>(API_ENDPOINTS[key], {
    method: options.method ?? 'POST',
    body: cosmeticsPayload(extra),
    timeoutMs: options.timeoutMs,
    retries: options.retries,
    idempotencyKey: options.idempotent ? createIdempotencyKey() : undefined,
  });
}

export { readReply, createIdempotencyKey };
