export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b(a|an|the|to)\b/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
