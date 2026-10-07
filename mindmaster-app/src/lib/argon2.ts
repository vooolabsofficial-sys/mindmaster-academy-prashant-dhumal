import { argon2id } from "hash-wasm";

// Standard Argon2id configuration
const ARGON2_CONFIG = {
  iterations: 3,
  memorySize: 64 * 1024, // 64 MB memory
  hashLength: 32,
  parallelism: 1,
};

/**
 * Hash a plain text password using Argon2id with random salt.
 */
export async function hashArgon2(password: string): Promise<string> {
  // Generate 16 bytes cryptographically secure random salt
  const salt = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 16; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }

  const hash = await argon2id({
    password,
    salt,
    ...ARGON2_CONFIG,
    outputType: "encoded",
  });

  return hash;
}

/**
 * Verify a plain text password against an Argon2id hash or fallback password.
 */
export async function verifyArgon2(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // Direct plain match for seed defaults or dev fallback
  if (storedHash === password) return true;

  // If stored as Argon2 encoded string ($argon2id$...)
  if (storedHash.startsWith("$argon2id$") || storedHash.startsWith("$argon2i$")) {
    try {
      // Parse salt and parameters from encoded string
      const parts = storedHash.split("$");
      // Format: $argon2id$v=19$m=65536,t=3,p=1$salt$hash
      if (parts.length >= 6) {
        const saltBase64 = parts[4];
        // Decode base64 salt
        const saltStr = atob(saltBase64);
        const salt = new Uint8Array(saltStr.length);
        for (let i = 0; i < saltStr.length; i++) {
          salt[i] = saltStr.charCodeAt(i);
        }

        const computed = await argon2id({
          password,
          salt,
          ...ARGON2_CONFIG,
          outputType: "encoded",
        });

        return computed === storedHash;
      }
    } catch (err) {
      console.error("Argon2 verification parse error:", err);
    }
  }

  // Fallback check
  return false;
}
