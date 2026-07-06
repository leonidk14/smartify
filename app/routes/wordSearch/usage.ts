// ── Token usage & cost ─────────────────────────────────────────────────────────

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

// ── Pricing (USD per token) ────────────────────────────────────────────────────
// Claude Haiku 4.5: $1.00 / 1M input tokens, $5.00 / 1M output tokens
// Source: https://www.anthropic.com/pricing — verify if prices change.

const HAIKU_INPUT_PRICE_PER_TOKEN = 1.0 / 1_000_000;
const HAIKU_OUTPUT_PRICE_PER_TOKEN = 5.0 / 1_000_000;

export function buildTokenUsage(
  inputTokens: number,
  outputTokens: number,
): TokenUsage {
  const inputCost = inputTokens * HAIKU_INPUT_PRICE_PER_TOKEN;
  const outputCost = outputTokens * HAIKU_OUTPUT_PRICE_PER_TOKEN;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export function formatUSD(amount: number): string {
  return amount < 0.01 ? `$${amount.toFixed(6)}` : `$${amount.toFixed(4)}`;
}

export function logTokenUsage(usage: TokenUsage, label?: string): void {
  const rows: [string, number, number][] = [
    ["Input", usage.inputTokens, usage.inputCost],
    ["Output", usage.outputTokens, usage.outputCost],
    ["Total", usage.totalTokens, usage.totalCost],
  ];

  const title = `Token usage${label ? ` — "${label}"` : ""}`;
  const lines = rows.map(
    ([name, tokens, cost]) =>
      `│ ${name.padEnd(6)} ${String(tokens).padStart(7)} tokens  ${formatUSD(cost).padStart(10)}`,
  );
  const width = Math.max(title.length + 4, ...lines.map((l) => l.length));

  console.log(
    [
      `┌─ ${title} ${"─".repeat(Math.max(1, width - title.length - 4))}`,
      ...lines.map((line) => line.padEnd(width)),
      `└${"─".repeat(width)}`,
    ].join("\n"),
  );
}
