import * as Crypto from 'expo-crypto';

export function generateUUID(): string {
  return Crypto.randomUUID();
}

// Fallback function if expo-crypto fails
export function generateSimpleId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}