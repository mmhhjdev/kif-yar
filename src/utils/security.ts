/**
 * Security & Cryptography Utilities for Kefyar
 * Uses Web Crypto API (AES-GCM & PBKDF2)
 */

async function getStorageKey(): Promise<CryptoKey> {
  const keyName = 'kefyar_device_key';
  let rawKey = localStorage.getItem(keyName);
  if (!rawKey) {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    rawKey = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(keyName, rawKey);
  }
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey('raw', enc.encode(rawKey), { name: 'PBKDF2' }, false, ['deriveKey']);
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('kefyar-static-salt-2025'), iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plainText: string): Promise<string> {
  try {
    const key = await getStorageKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const buf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
    const combined = new Uint8Array(iv.length + buf.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(buf), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

export async function decryptData(cipherText: string): Promise<string> {
  try {
    const key = await getStorageKey();
    const rawData = atob(cipherText);
    const combined = new Uint8Array(rawData.split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const buf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(buf);
  } catch {
    return cipherText;
  }
}

export const secureStorage = {
  async setItem(key: string, value: any): Promise<void> {
    localStorage.setItem(`sec_${key}`, await encryptData(JSON.stringify(value)));
  },
  async getItem<T>(key: string, fallback: T): Promise<T> {
    const encrypted = localStorage.getItem(`sec_${key}`);
    if (!encrypted) return fallback;
    try { return JSON.parse(await decryptData(encrypted)) as T; } catch { return fallback; }
  },
  removeItem(key: string): void {
    localStorage.removeItem(`sec_${key}`);
  }
};

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
