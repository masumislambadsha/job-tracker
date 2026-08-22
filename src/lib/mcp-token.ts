import fs from "fs";
import path from "path";
import { randomBytes, timingSafeEqual } from "crypto";

let cachedToken: string | null = null;

export function getMcpToken(): string {
  if (cachedToken) return cachedToken;

  let token = process.env.MCP_TOKEN || null;
  const tokenFile = path.join(process.cwd(), "mcp-server", ".token");
  if (!token) {
    try {
      token = fs.readFileSync(tokenFile, "utf8").trim() || null;
    } catch {
      /* first run */
    }
  }
  if (!token) {
    token = randomBytes(24).toString("hex");
    try {
      fs.mkdirSync(path.dirname(tokenFile), { recursive: true });
      fs.writeFileSync(tokenFile, `${token}\n`, { mode: 0o600 });
    } catch {
      /* read-only fs (serverless) */
    }
    if (process.env.NODE_ENV === "production" && !fs.existsSync(tokenFile)) {
      console.warn(
        "[mcp] MCP_TOKEN is not set and the filesystem is read-only — " +
          "a random ephemeral token is being used per server instance. " +
          "Set MCP_TOKEN in your environment for a stable token.",
      );
    }
  }

  cachedToken = token;
  return token;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function isMcpAuthorized(request: Request): boolean {
  const token = getMcpToken();

  const header = request.headers.get("authorization");
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (match && safeEqual(match[1], token)) return true;
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  return !!(queryToken && safeEqual(queryToken, token));
}

export function mcpCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  };
}
