import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { baseUrlFromOrigin } from "@/lib/oauth";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    /* ignore malformed body */
  }

  const name =
    typeof body.client_name === "string" && body.client_name
      ? body.client_name
      : "Job Tracker connector";

  const grantTypes = Array.isArray(body.grant_types)
    ? (body.grant_types as string[])
    : ["authorization_code", "refresh_token"];
  const responseTypes = Array.isArray(body.response_types)
    ? (body.response_types as string[])
    : ["code"];
  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as string[])
    : [];

  const authMethod =
    typeof body.token_endpoint_auth_method === "string"
      ? body.token_endpoint_auth_method
      : "none";

  const clientId = randomBytes(16).toString("hex");

  const base = baseUrlFromOrigin(request.headers.get("origin") || undefined);

  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: grantTypes,
      response_types: responseTypes,
      token_endpoint_auth_method: authMethod,
      client_id_metadata: {
        uri: `${base}/api/mcp`,
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
