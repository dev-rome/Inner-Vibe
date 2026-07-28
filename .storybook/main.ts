import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginOption } from "vite";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Swap Server Actions for spies.
 *
 * The real modules import the Supabase server client, which reads
 * next/headers and cannot run in a browser. A resolveId plugin rather than
 * resolve.alias, because the "@" path alias is applied by a plugin that would
 * otherwise rewrite the specifier before an alias entry could match it.
 * enforce: "pre" puts this ahead of that.
 */
function mockServerActions(): PluginOption {
  const targets: Record<string, string> = {
    "app/dashboard/actions": "mocks/dashboard-actions.ts",
    "app/(auth)/actions": "mocks/auth-actions.ts",
  };

  return {
    name: "innervibe:mock-server-actions",
    enforce: "pre",
    resolveId(source) {
      for (const [suffix, mock] of Object.entries(targets)) {
        if (source === `@/${suffix}` || source.endsWith(`/${suffix}`)) {
          return resolve(here, mock);
        }
      }
      return null;
    },
  };
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],

  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },

  viteFinal: async (viteConfig) => {
    // Tailwind v4 is a Vite plugin, and Storybook builds through its own Vite
    // instance rather than the Next config.
    viteConfig.plugins = [
      mockServerActions(),
      ...(viteConfig.plugins ?? []),
      tailwindcss(),
    ];

    return viteConfig;
  },
};

export default config;
