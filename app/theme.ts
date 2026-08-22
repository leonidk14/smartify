import {
  createTheme,
  rem,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";
import {
  fontSize,
  fontStack,
  fontWeight,
  lineHeight,
} from "./theme/typography";

const ink: MantineColorsTuple = [
  "#f5f5f4",
  "#e7e7e6",
  "#cfcfce",
  "#b0b0af",
  "#8f8f8e",
  "#6f6f6e",
  "#4d4d4c",
  "#333332",
  "#242423",
  "#1a1a1a",
];

// Semantic color tokens — one key per current use case, holding the exact value
// used today (no merging). Near-identical siblings (surfaceError*) are kept
// separate on purpose; collapsing them is a manual follow-up documented in
// app/theme/colors.md. Consumed as `var(--color-*)` via the resolver below.
const colors = {
  text: "#1a1a1a",
  textSuccess: "#1f8a5b",
  textError: "#c0392b",
  textErrorStrong: "#b4441e",
  surface: "#ffffff",
  surfaceWarm: "#f4f2ee",
  surfaceSuccess: "#e6f3ec",
  surfaceInfo: "#eef2ee",
  surfaceError: "#fdf3f1",
  surfaceError2: "#fbf1ee",
  surfaceError3: "#fbe9e7",
  border: "rgba(0, 0, 0, 0.1)",
  borderError: "#f0c9c3",
  borderErrorStrong: "#b4441e47",
  borderInfo: "rgba(30, 110, 70, 0.22)",
  warning: "#c87a1e",
  // Cream-on-dark cards (sign-in prompts) — inverse of the default surface.
  surfaceInverse: "#1a1a1a",
  textOnInverse: "#f0eee9",
  textOnInverseDimmed: "rgba(240, 238, 233, 0.65)",
};

const headingStyle = (size: number) => ({
  fontSize: rem(size),
  lineHeight: String(lineHeight.tight),
  fontWeight: String(fontWeight.regular),
});

export const theme = createTheme({
  white: "#ffffff",
  black: "#1a1a1a",
  primaryColor: "ink",
  primaryShade: 9,
  colors: { ink },
  fontFamily: fontStack.sans,
  fontFamilyMonospace: fontStack.mono,
  // Aligns Mantine's `size=` scale (controls, inputs) with the typography scale
  // in theme/typography.ts, so the app has one set of sizes rather than two.
  fontSizes: {
    xs: rem(fontSize.sm),
    sm: rem(fontSize.lg),
    md: rem(fontSize.xl),
    lg: rem(fontSize.display3),
    xl: rem(fontSize.display2),
  },
  headings: {
    fontFamily: fontStack.serif,
    sizes: {
      h1: headingStyle(fontSize.display1),
      h2: headingStyle(fontSize.display2),
      h3: headingStyle(fontSize.display3),
    },
  },
  other: colors,
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    "--font-family-sans": fontStack.sans,
    "--font-family-serif": fontStack.serif,
    "--font-family-mono": fontStack.mono,
    "--color-text": colors.text,
    "--color-text-success": colors.textSuccess,
    "--color-text-error": colors.textError,
    "--color-text-error-strong": colors.textErrorStrong,
    "--color-surface": colors.surface,
    "--color-surface-warm": colors.surfaceWarm,
    "--color-surface-success": colors.surfaceSuccess,
    "--color-surface-info": colors.surfaceInfo,
    "--color-surface-error": colors.surfaceError,
    "--color-surface-error-2": colors.surfaceError2,
    "--color-surface-error-3": colors.surfaceError3,
    "--color-border": colors.border,
    "--color-border-error": colors.borderError,
    "--color-border-error-strong": colors.borderErrorStrong,
    "--color-border-info": colors.borderInfo,
    "--color-warning": colors.warning,
    "--color-surface-inverse": colors.surfaceInverse,
    "--color-text-on-inverse": colors.textOnInverse,
    "--color-text-on-inverse-dimmed": colors.textOnInverseDimmed,
  },
  light: {},
  dark: {},
});
