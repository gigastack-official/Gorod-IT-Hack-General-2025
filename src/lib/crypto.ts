// Crypto utilities for the access control system

export interface KeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}

export interface StoredCredential {
  id: string;
  publicKeyJWK: JsonWebKey;
  privateKeyJWK?: JsonWebKey; // Only stored locally on card
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Challenge {
  id: string;
  nonce: string;
  timestamp: number;
  readerId: string;
  ttl: number; // Time to live in milliseconds
}

export interface ChallengeResponse {
  challengeId: string;
  credentialId: string;
  signatureB64: string;
  publicKeyJWK?: JsonWebKey;
}

/**
 * Generate ECDSA P-256 key pair for access control
 */
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true, // extractable
      ["sign", "verify"]
    );

    return keyPair as KeyPair;
  } catch (error) {
    throw new Error(`Failed to generate key pair: ${error}`);
  }
}

/**
 * Sign a challenge with private key
 */
export async function signChallenge(
  privateKey: CryptoKey,
  challenge: Challenge
): Promise<string> {
  try {
    const challengeData = JSON.stringify({
      id: challenge.id,
      nonce: challenge.nonce,
      timestamp: challenge.timestamp,
      readerId: challenge.readerId
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(challengeData);

    const signature = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      privateKey,
      data
    );

    // Convert to base64
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  } catch (error) {
    throw new Error(`Failed to sign challenge: ${error}`);
  }
}

/**
 * Verify challenge signature
 */
export async function verifyChallenge(
  publicKey: CryptoKey,
  challenge: Challenge,
  signatureB64: string
): Promise<boolean> {
  try {
    const challengeData = JSON.stringify({
      id: challenge.id,
      nonce: challenge.nonce,
      timestamp: challenge.timestamp,
      readerId: challenge.readerId
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(challengeData);

    // Convert from base64
    const signature = Uint8Array.from(
      atob(signatureB64),
      (c) => c.charCodeAt(0)
    );

    return await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signature,
      data
    );
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

/**
 * Export key to JWK format
 */
export async function exportKeyToJWK(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey("jwk", key);
}

/**
 * Import key from JWK format
 */
export async function importKeyFromJWK(
  jwk: JsonWebKey,
  usage: KeyUsage[]
): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    usage
  );
}

/**
 * Generate secure random nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Create a new challenge
 */
export function createChallenge(readerId: string, ttl: number = 300000): Challenge {
  return {
    id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nonce: generateNonce(),
    timestamp: Date.now(),
    readerId,
    ttl
  };
}

/**
 * Check if challenge is still valid
 */
export function isChallengeValid(challenge: Challenge): boolean {
  const now = Date.now();
  return (now - challenge.timestamp) < challenge.ttl;
}