import { NextResponse } from "next/server";
import { createAuthCode } from "@/lib/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri");
  const clientId = url.searchParams.get("client_id");
  const codeChallenge = url.searchParams.get("code_challenge");
  const method = url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");

  if (!redirectUri || !clientId || !codeChallenge || method !== "S256") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required OAuth parameters (redirect_uri, client_id, code_challenge, code_challenge_method=S256)." },
      { status: 400 }
    );
  }

  // Only allow redirect to HTTPS endpoints (Claude uses its own https redirect URIs)
  let parsedRedirect: URL;
  try {
    parsedRedirect = new URL(redirectUri);
  } catch {
    return NextResponse.json({ error: "invalid_request", error_description: "Invalid redirect_uri." }, { status: 400 });
  }
  if (parsedRedirect.protocol !== "https:") {
    return NextResponse.json({ error: "invalid_request", error_description: "redirect_uri must be HTTPS." }, { status: 400 });
  }

  // Single-user app: auto-grant the authorization code.
  const code = await createAuthCode(codeChallenge);

  const cb = new URL(parsedRedirect);
  cb.searchParams.set("code", code);
  if (state) cb.searchParams.set("state", state);

  return NextResponse.redirect(cb.toString(), { status: 302 });
}
