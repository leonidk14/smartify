export type PreselectKind = "marked" | "all" | "random";

export function parsePreselect(value: string | null): PreselectKind | null {
  return value === "marked" || value === "all" || value === "random"
    ? value
    : null;
}
