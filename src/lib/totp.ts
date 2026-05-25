import crypto from "crypto";

/**
 * Decodes a base32 encoded string into a Buffer.
 */
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let val = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${cleaned[i]}`);
    }
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((val >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure random base32 TOTP secret.
 */
export function generateTOTPSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(20); // 160 bits secret
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += alphabet[bytes[i] % 32];
  }
  return result;
}

/**
 * Generates an otpauth URI for Google Authenticator QR Code.
 */
export function generateTOTPUri(secret: string, email: string): string {
  const issuer = "ApartmanPlus";
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${encodedEmail}?secret=${secret}&issuer=${issuer}`;
}

/**
 * Verifies a 6-digit TOTP code against a base32 secret.
 * Supports window step check (default: 1 step of 30 seconds back/forth).
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const cBuf = Buffer.alloc(8);
      const c = BigInt(counter + i);
      cBuf.writeBigInt64BE(c);

      const hmac = crypto.createHmac("sha1", key).update(cBuf).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code =
        (((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)) %
        1000000;

      if (code.toString().padStart(6, "0") === token.trim()) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
