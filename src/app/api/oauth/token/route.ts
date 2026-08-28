import { NextResponse } from "next/server";
import { createAccessToken, pkceChallenge, verifyAuthCode } from "@/lib/oauth";

async function parseForm(request: Request): Promise<URLSearchParams> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      return new URLSearchParams(Object.entries(body));
    } catch {
      /* fall through to form parsing */
    }
  }
  const text = await request.text();
  return new URLSearchParams(text);
}

export async function POST(request: Request) {
  const params = await parseForm(request);

  const grantType = params.get("grant_type");
  if (grantType !== "authorization_code") {
    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  }

  const code = params.get("code");
  const codeVerifier = params.get("code_verifier");
  if (!code || !codeVerifier) {
    return NextResponse.json({ error: "invalid_request", error_description: "Missing code or code_verifier." }, { status: 400 });
  }

  const authCodeData = await verifyAuthCode(code);
  if (!authCodeData) {
    return NextResponse.json({ error: "invalid_grant", error_description: "Invalid or expired authorization code." }, { status: 400 });
  }

  const expectedChallenge = pkceChallenge(codeVerifier);
  if (expectedChallenge !== authCodeData.codeChallenge) {
    return NextResponse.json({ error: "invalid_grant", error_description: "PKCE code_verifier does not match." }, { status: 400 });
  }

  const { token, expiresIn } = await createAccessToken();

  return NextResponse.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope: "https://auth.mcp.dev/authorize",
  });
}
