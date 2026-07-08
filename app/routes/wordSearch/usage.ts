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
// Claude Haiku 4.5: $1.00 / 1M input, $5.00 / 1M output
// Claude Sonnet 5:  $3.00 / 1M input, $15.00 / 1M output
// Source: https://www.anthropic.com/pricing — verify if prices change.

export type PricingModel = "haiku" | "sonnet";

const PRICING: Record<PricingModel, { input: number; output: number }> = {
  haiku: { input: 1.0 / 1_000_000, output: 5.0 / 1_000_000 },
  sonnet: { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
};

export function buildTokenUsage(
  inputTokens: number,
  outputTokens: number,
  model: PricingModel = "haiku",
): TokenUsage {
  const price = PRICING[model];
  const inputCost = inputTokens * price.input;
  const outputCost = outputTokens * price.output;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

// Combine usage from multiple model calls (each already priced per its model).
export function sumTokenUsage(...usages: TokenUsage[]): TokenUsage {
  return usages.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + u.inputTokens,
      outputTokens: acc.outputTokens + u.outputTokens,
      totalTokens: acc.totalTokens + u.totalTokens,
      inputCost: acc.inputCost + u.inputCost,
      outputCost: acc.outputCost + u.outputCost,
      totalCost: acc.totalCost + u.totalCost,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    },
  );
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
