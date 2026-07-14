# Project conventions

## Styling (Mantine)

Prefer Mantine component **style props** over inline `style={{}}` objects. Reach for
`style` only for CSS properties that have no Mantine prop.

- Use props for spacing, sizing, color, layout, position, typography, borders:
  `p`/`px`/`py`/`m`/`mt`…, `w`/`h`/`miw`/`maw`, `bg`/`c`, `fz`/`fw`/`lh`/`ta`/`tt`,
  `pos`/`top`/`bottom`/`left`/`right`/`inset`, `flex`, `bd` (border), `bdrs`
  (border-radius). A full `border` shorthand + rounded corners is `bd="1px solid …"`
  `bdrs={14}`, not an inline `style`.
- Use the purpose-built components instead of hand-rolling flexbox: `Center` /
  `Group` / `Stack` / `Flex` for layout, `ThemeIcon` for an icon in a
  colored/bordered square or circle (its `size`/`radius`/`variant`/`color` props
  cover background, border, and centering).
- Keep in inline `style` only what Mantine has no prop for — e.g. single-side borders
  (`borderBottom` / `borderTop`), `cursor`, `userSelect`.
- Non-Mantine elements (e.g. Tabler `@tabler/icons-react` SVGs) take their own
  props (`size`, `color`) and `style`; Mantine style props don't apply to them.

Reference examples: [app/routes/practice/practiceStart.tsx](app/routes/practice/practiceStart.tsx),
[app/routes/practice/practiceSelect.tsx](app/routes/practice/practiceSelect.tsx).

## Design references

Designs live in a Claude Design project. Whenever a design is referenced — **including
when the user pastes a `claude.ai/design/...` URL** — read the frames through the
`DesignSync` MCP tool (`list_files`, then `get_file`), not by fetching the URL. The URL
only identifies the project; the actual frame markup is available exclusively via MCP.
