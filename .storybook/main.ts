import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  addons: ["@storybook/addon-a11y"],

  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },

  // Tailwind v4 is a Vite plugin, not a PostCSS step. Storybook builds through
  // its own Vite instance rather than the Next config, so it has to be added
  // here too or globals.css imports but generates no utilities.
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;
