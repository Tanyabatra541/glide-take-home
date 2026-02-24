import crypto from "crypto";

const SSN_ENCRYPTION_KEY =
  process.env.SSN_ENCRYPTION_KEY || "development-only-ssn-key-change-me";

// Derive a 32-byte key from the configured secret so that any reasonably
// long string can be used in development and tests.
const KEY = crypto.createHash("sha256").update(SSN_ENCRYPTION_KEY).digest();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended length for GCM

export function encryptSSN(ssn: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([cipher.update(ssn, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store IV + authTag + ciphertext together so that we can decrypt later
  // if a future requirement needs it.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

