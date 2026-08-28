import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "jobdesk_oauth_secret_change_in_production"
);

const AUTH_CODE_MAX_AGE = 10 * 60; // 10 min
const ACCESS_TOKEN_MAX_AGE = 60 * 60; // 1 hour

export function baseUrlFromOrigin(origin?: string): string {
  if (origin) return origin.replace(/\/+$/, "");
  return (process.env.NEXT_PUBLIC_APP_URL || "https://job-apply-track.vercel.app").replace(/\/+$/, "");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function createAuthCode(codeChallenge: string): Promise<string> {
  return new SignJWT({ cch: codeChallenge })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_CODE_MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifyAuthCode(
  code: string
): Promise<{ codeChallenge: string } | null> {
  try {
    const { payload } = await jwtVerify(code, SECRET);
    if (!payload.cch) return null;
    return { codeChallenge: payload.cch as string };
  } catch {
    return null;
  }
}

export async function createAccessToken(): Promise<{ token: string; expiresIn: number }> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE}s`)
    .sign(SECRET);
  return { token, expiresIn: ACCESS_TOKEN_MAX_AGE };
}

export async function isOAuthAccessToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}
