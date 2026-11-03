import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// The current Node/jsdom combination can expose localStorage as undefined. Provide a small
// in-memory Storage implementation so tests exercise the same token-store interface.
const values = new Map<string, string>();
const storage: Storage = {
  get length() {
    return values.size;
  },
  clear: () => values.clear(),
  getItem: (key: string) => values.get(String(key)) ?? null,
  key: (index: number) => [...values.keys()][index] ?? null,
  removeItem: (key: string) => {
    values.delete(String(key));
  },
  setItem: (key: string, value: string) => values.set(String(key), String(value)),
};
Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

afterEach(() => cleanup());
