import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { resolve } from "node:path";

const alias = { "@": resolve(import.meta.dirname, "./src") };

export default defineConfig({
  test: {
    projects: [
      // Logic and component tests in jsdom. Fast, and the only place that can
      // reach non-browser code like the Zod schemas.
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./src/test/setup.ts"],
          css: true,
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      // Every story run as a test in a real browser. This is what turns the
      // a11y panel into a build failure, and it is the only place play
      // functions can verify things jsdom does not implement, such as
      // arrow-key navigation in a radio group.
      //
      // addon-vitest applies the preview annotations itself, so there is no
      // setup file here.
      {
        plugins: [tailwindcss(), storybookTest({ configDir: ".storybook" })],
        resolve: { alias },
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
