/**
 * Idempotency utility for reservation and order creation.
 *
 * The backend requires an `Idempotency-Key` header on:
 *   - POST /reservations
 *   - POST /orders
 *
 * Rules:
 * - Generate a UUID v4 for each new reservation or order intent.
 * - Send both `Idempotency-Key` and `idempotency-key` headers (HTTP headers
 *   are case-insensitive per RFC 7230; the live spec lists both variants).
 * - Reuse the same key when retrying the same logical operation.
 * - Generate a new key for a genuinely new user intent.
 *
 * Note: The live OpenAPI spec lists both `idempotency-key` and
 * `Idempotency-Key` on the same operations. Both are sent here.
 */

import {
  generateIdempotencyKey,
  IDEMPOTENCY_KEY_HEADER,
} from '@mitdrone/types';

export { generateIdempotencyKey };

/**
 * Idempotency key store keyed by logical operation name.
 *
 * In production, callers should persist the key for the lifetime of the
 * user intent (e.g. in React state keyed by reservation or order creation
 * form). This utility holds keys in memory for the module lifetime, which
 * is sufficient for demo/staged use. Swap in a persistent store (localStorage
 * is NOT acceptable for session credentials, but an idempotency key is not a
 * credential) before production use.
 */
const keyStore = new Map<string, string>();

/**
 * Get or generate an idempotency key for a logical operation.
 *
 * Reusing the same `operationId` returns the same key, which is correct for
 * retrying the same intent. Use a different `operationId` for a new intent.
 */
export function getIdempotencyKey(operationId: string): string {
  let key = keyStore.get(operationId);
  if (!key) {
    key = generateIdempotencyKey();
    keyStore.set(operationId, key);
  }
  return key;
}

/**
 * Generate a fresh key for a new intent and register it under `operationId`.
 * Any previously registered key for the same `operationId` is replaced.
 */
export function newIdempotencyKey(operationId: string): string {
  const key = generateIdempotencyKey();
  keyStore.set(operationId, key);
  return key;
}

/**
 * Remove the registered key for an operation (e.g. after a successful
 * reservation or order is no longer retryable).
 */
export function clearIdempotencyKey(operationId: string): void {
  keyStore.delete(operationId);
}

/**
 * Build the idempotency header map. Returns an empty object when
 * no key is supplied (caller may choose not to send the header for reads).
 *
 * The live OpenAPI spec lists both `idempotency-key` and `Idempotency-Key`
 * on reservation and order creation. Both variants are sent here for
 * compatibility; HTTP headers are case-insensitive per RFC 7230.
 */
export function idempotencyHeaders(key?: string): Record<string, string> {
  if (!key) return {};
  return {
    [IDEMPOTENCY_KEY_HEADER]: key,
    'idempotency-key': key,
  };
}

/**
 * Validate that a value looks like a UUID v4 idempotency key.
 */
export function isValidIdempotencyKey(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Confirm at least one idempotency header variant is present when a key exists.
 */
export function assertIdempotencyHeaderPresent(
  headers: Record<string, string>,
  key?: string,
): void {
  if (!key) return;
  if (!(IDEMPOTENCY_KEY_HEADER in headers || 'idempotency-key' in headers)) {
    throw new Error('Idempotency-Key header missing for mutating request.');
  }
}
