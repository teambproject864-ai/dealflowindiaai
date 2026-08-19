/**
 * Shared utility functions for cryptographically secure password generation and validation
 */

/**
 * Generates a cryptographically strong, high-entropy random password.
 * Uses Web Crypto API (crypto.getRandomValues) with unbiased rejection sampling to guarantee uniform distribution.
 * Throws an explicit error if Web Crypto API is unavailable.
 * 
 * @param length Desired password length (defaults to 16, min 16)
 * @returns Secure random password string containing uppercase, lowercase, digits, and special characters
 */
export function generateRandomStrongPassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*()_+-=";
  const all = upper + lower + digits + special;

  const getCryptoInstance = (): Crypto => {
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      return window.crypto;
    }
    if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
      return globalThis.crypto;
    }
    throw new Error("Web Crypto API (crypto.getRandomValues) is required for secure password generation");
  };

  const cryptoInstance = getCryptoInstance();

  /**
   * Generates an unbiased random integer in the range [0, max) using rejection sampling.
   */
  const getRandomInt = (max: number): number => {
    if (max <= 0) return 0;

    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    // Calculate largest multiple of max <= maxUint32 to eliminate modulo bias
    const limit = maxUint32 - (maxUint32 % max);

    let randomVal: number;
    do {
      cryptoInstance.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);

    return randomVal % max;
  };

  // Pick guaranteed characters for all 4 required complexity classes
  const chars: string[] = [
    upper.charAt(getRandomInt(upper.length)),
    upper.charAt(getRandomInt(upper.length)),
    lower.charAt(getRandomInt(lower.length)),
    lower.charAt(getRandomInt(lower.length)),
    digits.charAt(getRandomInt(digits.length)),
    digits.charAt(getRandomInt(digits.length)),
    special.charAt(getRandomInt(special.length)),
    special.charAt(getRandomInt(special.length)),
  ];

  // Fill remaining positions to target length
  const targetLength = Math.max(length, 16);
  while (chars.length < targetLength) {
    chars.push(all.charAt(getRandomInt(all.length)));
  }

  // Cryptographic Fisher-Yates shuffle with unbiased random index selection
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
