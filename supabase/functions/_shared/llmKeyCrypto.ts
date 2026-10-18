import { requireEnv } from "./env.ts";

const CURRENT_KEY_VERSION = 1;
const KEY_BYTES = 32;
const IV_BYTES = 12;

export interface EncryptedLlmKey {
  ciphertext: string;
  iv: string;
  keyVersion: number;
}

// Raised only when a stored row does not decrypt — tampered or copied ciphertext,
// or a master key other than the one that encrypted it. A missing or malformed
// master-key secret is an operator fault and surfaces as its own error instead.
export class LlmKeyDecryptionError extends Error {
  constructor() {
    super("Stored LLM key could not be decrypted");
    this.name = "LlmKeyDecryptionError";
  }
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function encodeBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function encodeText(value: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(value);
}

// One secret per version, so a new master key is introduced as `_V2` while rows
// encrypted under `_V1` keep decrypting.
async function importMasterKey(keyVersion: number): Promise<CryptoKey> {
  const secretName = `LLM_KEY_ENCRYPTION_KEY_V${keyVersion}`;
  const rawKey = decodeBase64(requireEnv(secretName));
  // importKey also accepts a 16-byte key and would silently run AES-128, so
  // this length check is what makes it AES-256.
  if (rawKey.length !== KEY_BYTES) {
    throw new Error(`${secretName} must be 32 bytes, base64-encoded`);
  }
  return await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// The user id is bound in as additional authenticated data: it is not encrypted,
// but decryption fails unless the same id is supplied, so a ciphertext copied
// into another user's row is useless there.
export async function encryptLlmKey({
  userId,
  apiKey,
}: {
  userId: string;
  apiKey: string;
}): Promise<EncryptedLlmKey> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encodeText(userId) },
    await importMasterKey(CURRENT_KEY_VERSION),
    encodeText(apiKey),
  );

  return {
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
    iv: encodeBase64(iv),
    keyVersion: CURRENT_KEY_VERSION,
  };
}

export async function decryptLlmKey({
  userId,
  ciphertext,
  iv,
  keyVersion,
}: {
  userId: string;
  ciphertext: string;
  iv: string;
  keyVersion: number;
}): Promise<string> {
  const masterKey = await importMasterKey(keyVersion);

  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodeBase64(iv),
        additionalData: encodeText(userId),
      },
      masterKey,
      decodeBase64(ciphertext),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new LlmKeyDecryptionError();
  }
}
