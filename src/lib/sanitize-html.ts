/**
 * Sanitiza HTML vindo de fontes externas (ex: CSV do WooCommerce).
 * - Converte escapes literais (\n, \r, \t) em quebras reais
 * - Remove blocos perigosos (script, style, iframe, etc)
 * - Remove handlers on* e URLs javascript:
 * - Converte texto puro em <br> quando não há tags
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  let s = html
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ");
  s = s.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");
  s = s.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  s = s.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  s = s.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
  s = s.replace(/(href|src)\s*=\s*"(\s*javascript:[^"]*)"/gi, '$1="#"');
  s = s.replace(/(href|src)\s*=\s*'(\s*javascript:[^']*)'/gi, "$1='#'");
  if (!/<[a-z][\s\S]*>/i.test(s)) {
    s = s.replace(/\n/g, "<br>");
  }
  return s.trim();
}
