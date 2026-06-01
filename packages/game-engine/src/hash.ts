// Deterministic state hash for MatchState.
// Uses sorted-key serialization — no Date.now, no Math.random.
// Same state contents always produce the same hash string, regardless of key insertion order.

import type { MatchState } from '../../shared/src/index';

function sortedStringify(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'null';
  if (typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) {
    return '[' + val.map(sortedStringify).join(',') + ']';
  }
  const obj = val as Record<string, unknown>;
  // Filter undefined values (matches JSON.stringify behavior) then sort keys
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + sortedStringify(obj[k])).join(',') + '}';
}

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Stable, deterministic hash of MatchState.
 * Produces an 8-char hex string. Sorted keys ensure key-insertion-order independence.
 */
export function stateHash(state: MatchState): string {
  return djb2(sortedStringify(state));
}
