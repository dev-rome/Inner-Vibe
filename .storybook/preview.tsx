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
 * globals.css resolves --font-sans through --font-inter, which next/font
 * normally defines on <html> in the root layout. Storybook has no layout, so
 * without this the variables are undefined and every story silently falls back
 * to a system font, making type review worthless.
 *
 * Same for the page background: components are built to sit on --color-surface,
 * so a default white canvas would misrepresent every border and contrast pair.
 */
const withDesignSystem: Decorator = (Story) => (
  <div
    className={`${inter.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} bg-surface text-ink font-sans`}
  >
    <div className="p-6">
      <Story />
    </div>
  </div>
);

const preview: Preview = {
  decorators: [withDesignSystem],
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    a11y: {
      // "error" fails the run rather than only annotating the panel, so a
      // contrast or naming regression is a hard signal, not a note someone
      // has to remember to read.
      test: "error",
    },
    backgrounds: { disable: true },
  },
};

export default preview;
