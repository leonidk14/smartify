import "~/app.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { definePreview, type Decorator } from "@storybook/react-vite";
import { setupWorker } from "msw/browser";
import addonMsw from "msw-storybook-addon";
import { MINIMAL_VIEWPORTS, type ViewportMap } from "storybook/viewport";
import { cssVariablesResolver, theme } from "~/theme";
import { handlers } from "./msw/handlers";

// The app is a mobile-first PWA, so every story frames at a phone width by
// default. 393 matches the Chromatic viewport below and the test viewport in
// vite.config.ts, so dev, snapshots, and tests all agree on one size. The stock
// presets stay available in the toolbar for checking other sizes.
const viewportOptions: ViewportMap = {
  mobile393: {
    name: "Mobile (393)",
    styles: { width: "393px", height: "852px" },
    type: "mobile",
  },
  ...MINIMAL_VIEWPORTS,
};

const withMantine: Decorator = (Story) => (
  <MantineProvider
    theme={theme}
    cssVariablesResolver={cssVariablesResolver}
    defaultColorScheme="light">
    <Notifications position="top-center" />
    <Story />
  </MantineProvider>
);

const startWorker = async () => {
  const worker = setupWorker(...handlers);
  await worker.start({
    quiet: true,
    // Only the backend is worth warning about: `readVocabulary` turns a
    // connection failure into the offline snapshot, so a missing handler would
    // otherwise look like an empty vocabulary. Vite and asset traffic is noise.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).hostname !== "supabase.test") {
        return;
      }
      print.warning();
    },
  });
  return worker;
};

export default definePreview({
  addons: [addonMsw(startWorker)],
  decorators: [withMantine],
  parameters: {
    layout: "fullscreen",
    chromatic: { viewports: [393] },
    viewport: { options: viewportOptions },
  },
  initialGlobals: {
    viewport: { value: "mobile393", isRotated: false },
  },
});
