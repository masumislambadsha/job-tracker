import { NextResponse } from "next/server";
import { baseUrlFromOrigin } from "@/lib/oauth";

export async function GET(request: Request) {
  const origin = request.headers.get("origin") || request.headers.get("referer") || undefined;
  const base = baseUrlFromOrigin(origin);

  const metadata = {
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["https://auth.mcp.dev/authorize"],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
