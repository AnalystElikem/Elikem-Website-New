import crypto from "crypto";

function base64UrlEncode(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

type AccessTokenPayload = {
  email: string;
  exp: number; // unix ms
};

export function createAccessToken(email: string): string {
  const secret = process.env.DRIVE_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      "Missing env var DRIVE_ACCESS_SECRET (used to sign access tokens)",
    );
  }

  const ttlMs = parseInt(process.env.DRIVE_ACCESS_TOKEN_TTL_MS || "86400000", 10); // 24h
  const exp = Date.now() + ttlMs;

  const payload: AccessTokenPayload = { email, exp };
  const payloadJson = JSON.stringify(payload);

  const sig = crypto
    .createHmac("sha256", secret)
    .update(payloadJson)
    .digest();

  const token =
    base64UrlEncode(Buffer.from(payloadJson, "utf-8")) +
    "." +
    base64UrlEncode(sig);

  return token;
}

export function getEmailFromAccessToken(token: string): string | null {
  const secret = process.env.DRIVE_ACCESS_SECRET;
  if (!secret) return null;

  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const payloadJson = base64UrlDecode(payloadB64).toString("utf-8");
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadJson)
      .digest();
    const actualSig = base64UrlDecode(sigB64);

    if (actualSig.length !== expectedSig.length) return null;

    if (
      !crypto.timingSafeEqual(
        expectedSig,
        actualSig,
      )
    ) {
      return null;
    }

    const payload = JSON.parse(payloadJson) as AccessTokenPayload;
    if (!payload.email || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;

    return payload.email;
  } catch {
    return null;
  }
}

