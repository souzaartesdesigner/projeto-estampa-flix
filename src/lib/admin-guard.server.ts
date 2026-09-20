import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies (server-side) that the authenticated caller has the "admin" role.
 * Throws a 403 Response when the caller is not an admin.
 */
export async function assertAdmin(supabase: SupabaseClient<any>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Response("Forbidden", { status: 403 });
  }
}

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /\.internal$/i,
  /\.local$/i,
  /^metadata\./i,
];

/**
 * Only allow fetching images from public https hosts (blocks SSRF into
 * private/link-local/metadata network ranges).
 */
export function assertSafeExternalImageUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Response("URL inválida", { status: 400 });
  }
  if (parsed.protocol !== "https:") {
    throw new Response("Apenas URLs https são permitidas", { status: 400 });
  }
  const host = parsed.hostname;
  if (BLOCKED_HOST_PATTERNS.some((re) => re.test(host))) {
    throw new Response("Host não permitido", { status: 400 });
  }
}
