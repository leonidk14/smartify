import type { CSSProperties } from "react";
import type { MantineStyleProps } from "@mantine/core";

// Deliberately narrower than TextProps: only the style props, so a token can be
// spread onto any Mantine component (Text, Box, Center, Button) without dragging
// in component-specific props like `vars` / `classNames` that fail to typecheck.
type TypographyProps = MantineStyleProps & { style?: CSSProperties };

export const fontStack = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: "ui-monospace, Menlo, Consolas, monospace",
} as const;

type Family = keyof typeof fontStack;

const familyVar: Record<Family, string> = {
  sans: "var(--font-family-sans)",
  serif: "var(--font-family-serif)",
  mono: "var(--font-family-mono)",
};

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 14,
  xl: 16,
  display3: 18,
  display2: 22,
  display1: 26,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.35,
  body: 1.5,
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;

interface Recipe {
  family?: Family;
  size?: number;
  weight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  isItalic?: boolean;
  isUppercase?: boolean;
  isDimmed?: boolean;
}

// The one source of truth. Recipes carry family, size, line-height, weight, style
// and letter-spacing only — never `tt="capitalize"` (a content concern) or layout
// props. `isDimmed` is set only where the color is invariant across every call
// site; a later prop on the element still overrides it.
const recipes = {
  displayLg: {
    family: "serif",
    size: fontSize.display1,
    lineHeight: lineHeight.tight,
    weight: fontWeight.regular,
  },
  displayMd: {
    family: "serif",
    size: fontSize.display2,
    lineHeight: lineHeight.tight,
    weight: fontWeight.regular,
  },
  displaySm: {
    family: "serif",
    size: fontSize.display3,
    lineHeight: lineHeight.tight,
    weight: fontWeight.regular,
  },
  prose: {
    family: "serif",
    size: fontSize.display1,
    lineHeight: lineHeight.snug,
    weight: fontWeight.regular,
  },
  proseSm: {
    family: "serif",
    size: fontSize.xl,
    lineHeight: lineHeight.body,
    weight: fontWeight.regular,
  },
  annotation: {
    family: "serif",
    size: fontSize.md,
    lineHeight: lineHeight.body,
    weight: fontWeight.regular,
    isItalic: true,
    isDimmed: true,
  },

  label: {
    family: "mono",
    size: fontSize.xs,
    weight: fontWeight.medium,
    letterSpacing: ".5px",
    isUppercase: true,
    isDimmed: true,
  },
  meta: {
    family: "mono",
    size: fontSize.sm,
    weight: fontWeight.regular,
    isDimmed: true,
  },
  metaLg: {
    family: "mono",
    size: fontSize.lg,
    weight: fontWeight.medium,
    isDimmed: true,
  },

  body: {
    family: "sans",
    size: fontSize.xl,
    lineHeight: lineHeight.body,
  },
  bodySm: {
    family: "sans",
    size: fontSize.lg,
    lineHeight: lineHeight.body,
  },
  bodyXs: {
    family: "sans",
    size: fontSize.md,
    lineHeight: lineHeight.body,
  },
  uiLabel: {
    family: "sans",
    size: fontSize.lg,
    lineHeight: lineHeight.body,
    weight: fontWeight.semibold,
  },
  headline: {
    family: "sans",
    size: fontSize.display2,
    lineHeight: lineHeight.tight,
    weight: fontWeight.semibold,
  },
  // Inline emphasis inside running text — deliberately carries no size so it
  // inherits from the surrounding paragraph.
  emphasis: {
    weight: fontWeight.semibold,
  },
} satisfies Record<string, Recipe>;

export type TypographyToken = keyof typeof recipes;

const toTextProps = (recipe: Recipe): TypographyProps => ({
  ...(recipe.family ? { ff: familyVar[recipe.family] } : {}),
  ...(recipe.size ? { fz: recipe.size } : {}),
  ...(recipe.weight ? { fw: recipe.weight } : {}),
  ...(recipe.lineHeight ? { lh: recipe.lineHeight } : {}),
  ...(recipe.isItalic ? { fs: "italic" } : {}),
  ...(recipe.isUppercase ? { tt: "uppercase" } : {}),
  ...(recipe.isDimmed ? { c: "dimmed" } : {}),
  ...(recipe.letterSpacing
    ? { style: { letterSpacing: recipe.letterSpacing } }
    : {}),
});

const toCss = (recipe: Recipe): CSSProperties => ({
  ...(recipe.family ? { fontFamily: familyVar[recipe.family] } : {}),
  ...(recipe.size ? { fontSize: recipe.size } : {}),
  ...(recipe.weight ? { fontWeight: recipe.weight } : {}),
  ...(recipe.lineHeight ? { lineHeight: recipe.lineHeight } : {}),
  ...(recipe.isItalic ? { fontStyle: "italic" } : {}),
  ...(recipe.isUppercase ? { textTransform: "uppercase" } : {}),
  ...(recipe.isDimmed ? { color: "var(--mantine-color-dimmed)" } : {}),
  ...(recipe.letterSpacing ? { letterSpacing: recipe.letterSpacing } : {}),
});

const mapRecipes = <T>(transform: (recipe: Recipe) => T) =>
  Object.fromEntries(
    Object.entries(recipes).map(([name, recipe]) => [name, transform(recipe)]),
  ) as Record<TypographyToken, T>;

/** Spread onto Mantine components: `<Text {...text.label}>`. */
export const text = mapRecipes(toTextProps);

/** For `styles={{}}` slots that props cannot reach (input, badge label). */
export const textCss = mapRecipes(toCss);
