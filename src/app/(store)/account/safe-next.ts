// Only allow redirects back into this site
export function safeNext(next: unknown, fallback = "/account") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
