import { createSeed, MOCK_PASSWORD, REF_NOW, type Seed } from '@mitdrone/data';

import type { AuditAction, AuditEntityType, PaymentIntent, User } from '@mitdrone/types';

export interface Db extends Seed {
  /** email -> password. Seeded users fall back to MOCK_PASSWORD. */
  passwords: Record<string, string>;
  intents: Map<string, PaymentIntent>;
  counter: number;
}

const DAY_MS = 86_400_000;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Adds `delta` to every ISO date string inside `node`, in place. Returns the (possibly new) value. */
function shiftDates(node: unknown, delta: number): unknown {
  if (typeof node === 'string') {
    if (ISO_DATETIME.test(node)) return new Date(new Date(node).getTime() + delta).toISOString();
    if (DATE_ONLY.test(node))
      return new Date(new Date(`${node}T00:00:00Z`).getTime() + delta).toISOString().slice(0, 10);
    return node;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => (node[i] = shiftDates(item, delta)));
  } else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) record[key] = shiftDates(record[key], delta);
  }
  return node;
}

/**
 * The seed is pinned to a fixed date so it is deterministic. The mock API, however, compares
 * data against the real clock (deal expiry, "last 30 days" charts). Shifting every seeded date
 * forward by whole days keeps the data looking recent no matter when the project is run.
 */
function init(): Db {
  const seed = createSeed();
  const delta = Math.round((Date.now() - REF_NOW.getTime()) / DAY_MS) * DAY_MS;
  if (delta !== 0) shiftDates(seed, delta);
  return { ...seed, passwords: {}, intents: new Map(), counter: 0 };
}

let db: Db = init();

/** Always call getDb() inside handlers: resetDb() replaces the instance. */
export function getDb(): Db {
  return db;
}

export function resetDb(): void {
  db = init();
}

export function nextId(prefix: string): string {
  db.counter += 1;
  return `${prefix}_new_${String(db.counter).padStart(4, '0')}`;
}

export function passwordFor(email: string): string {
  return db.passwords[email.toLowerCase()] ?? MOCK_PASSWORD;
}

/** Every admin mutation must call this so the audit log stays complete. */
export function writeAudit(
  actor: User,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  summary: string,
  metadata?: Record<string, unknown>,
): void {
  db.auditLogs.unshift({
    id: nextId('aud'),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    summary,
    ...(metadata ? { metadata } : {}),
    ip: '127.0.0.1',
    createdAt: new Date().toISOString(),
  });
}
