import crypto from "crypto";

/**
 * Validates whether an incoming HTTP request is authenticated with the master ADMIN_SECRET_KEY.
 *
 * Rules:
 * - Reads the `X-Admin-Secret` header from the request.
 * - Compares it in constant time (crypto.timingSafeEqual on equal-length buffers) with process.env.ADMIN_SECRET_KEY.
 * - If process.env.ADMIN_SECRET_KEY is missing or shorter than 16 characters, fails closed (returns false).
 */
export function isAdminRequest(
  request: Request | { headers: Headers | Record<string, string | string[] | undefined> }
): boolean {
  const secretKey = process.env.ADMIN_SECRET_KEY;
  if (!secretKey || secretKey.length < 16) {
    return false;
  }

  let clientSecret: string | null = null;
  if (request && "headers" in request) {
    const headers = request.headers as any;
    if (typeof headers.get === "function") {
      clientSecret = headers.get("x-admin-secret");
    } else if (typeof headers === "object") {
      clientSecret =
        headers["x-admin-secret"] ||
        headers["X-Admin-Secret"] ||
        null;
      if (Array.isArray(clientSecret)) {
        clientSecret = clientSecret[0] || null;
      }
    }
  }

  if (!clientSecret) {
    return false;
  }

  const secretBuffer = Buffer.from(secretKey, "utf8");
  const clientBuffer = Buffer.from(clientSecret, "utf8");

  if (secretBuffer.length !== clientBuffer.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(secretBuffer, clientBuffer);
  } catch {
    return false;
  }
}
