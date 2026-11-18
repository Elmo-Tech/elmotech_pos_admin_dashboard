import "server-only";
import { createHash, randomBytes } from "node:crypto";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeCrockford(bytes: Uint8Array): string {
  let bits = 0;
  let buffer = 0;
  let result = "";

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += CROCKFORD_BASE32[(buffer >>> bits) & 31];
      buffer &= (1 << bits) - 1;
    }
  }

  if (bits > 0) result += CROCKFORD_BASE32[(buffer << (5 - bits)) & 31];
  return result;
}

export function generateLicenseCode(): string {
  const encoded = encodeCrockford(randomBytes(20));
  return `ELMO-${encoded.match(/.{1,4}/g)?.join("-") ?? encoded}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
