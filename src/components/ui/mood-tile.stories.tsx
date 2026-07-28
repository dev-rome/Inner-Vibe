import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MOOD_OPTIONS } from "@/lib/moods";
import { MoodTile } from "./mood-tile";

const meta = {
  title: "Primitives/MoodTile",
  component: MoodTile,
  args: { name: "rating", value: 5, emoji: "\u{1F60A}", label: "Good" },
} satisfies Meta<typeof MoodTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/*
 * A tile is aspect-square and full-width, so it needs a constrained parent to
 * review on its own. Applied per story rather than on meta: story decorators
 * compose with meta ones instead of replacing them, so a meta-level wrapper
 * would squash FullScale below and there is no way to opt out of it.
 */
const constrained: Story["decorators"] = [
  (Story) => (
    <div className="w-20">
      <Story />
    </div>
  ),
];

export const Unselected: Story = {
  decorators: constrained,
};

/**
 * The only mood state that carries colour, and one of just three places coral
 * appears in the whole app.
 */
export const Selected: Story = {
  args: { defaultChecked: true },
  decorators: constrained,
};

/**
 * The full scale, which is the view that matters.
 *
 * Every unselected tile is deliberately identical: a low mood must not look
 * worse than a high one. The emoji carries the difference, the colour does
 * not. Reviewing them apart from each other would hide a regression here.
 */
export const FullScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <fieldset className="max-w-md">
      <legend className="text-ink text-base font-medium">
        How are you feeling?
      </legend>
      <div className="mt-3 grid grid-cols-6 gap-2">
        {MOOD_OPTIONS.map((option) => (
          <MoodTile
            key={option.value}
            name="scale-demo"
            value={option.value}
            emoji={option.emoji}
            label={option.label}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="text-subtle mt-2 flex justify-between text-xs"
      >
        <span>{MOOD_OPTIONS[0].label}</span>
        <span>{MOOD_OPTIONS[MOOD_OPTIONS.length - 1].label}</span>
      </div>
    </fieldset>
  ),
};
