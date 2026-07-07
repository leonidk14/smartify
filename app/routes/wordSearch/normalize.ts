export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b(a|an|the|to)\b/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
