import type { Preview, Decorator } from "@storybook/nextjs-vite";
import { Instrument_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "../src/app/globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

/*
 * The font variables go on <html>, matching what the root layout does in the
 * app. A decorator wrapping the story is not good enough, and the reason is
 * subtle enough to be worth writing down.
 *
 * globals.css declares --font-sans as `var(--font-inter), ...` inside @theme,
 * which Tailwind emits at :root. Custom properties are substituted where they
 * are *declared*, not where they are used. With --font-inter defined on a
 * nested div, :root resolves var(--font-inter) against nothing, so --font-sans
 * becomes guaranteed-invalid — and that empty value then inherits everywhere,
 * even into elements that can see --font-inter perfectly well.
 *
 * The symptom is quiet: every story falls back to the system font while
 * looking close enough to pass a glance, which makes type review worthless.
 */
if (typeof document !== "undefined") {
  document.documentElement.classList.add(
    inter.variable,
    instrumentSans.variable,
    jetbrainsMono.variable,
  );
}

/*
 * Components are built to sit on --color-surface, so a default white canvas
 * would misrepresent every border and contrast pair in the system.
 */
const withCanvas: Decorator = (Story) => (
  <div className="bg-surface text-ink font-sans p-6">
    <Story />
  </div>
);

const preview: Preview = {
  decorators: [withCanvas],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    a11y: {
      // "error" fails the run rather than only annotating the panel, so a
      // contrast or naming regression is a hard signal. Takes effect once
      // stories run as tests via addon-vitest; today it is panel-only.
      test: "error",
    },
    backgrounds: { disable: true },
  },
};

export default preview;
