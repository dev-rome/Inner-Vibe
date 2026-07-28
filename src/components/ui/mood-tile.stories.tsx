import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { MOOD_OPTIONS } from "@/lib/moods";
import { MoodTile } from "./mood-tile";

const meta = {
  title: "Primitives/MoodTile",
  component: MoodTile,
  args: { name: "rating", value: 5, emoji: "\u{1F60A}", label: "Good" },
} satisfies Meta<typeof MoodTile>;

export default meta;
type Story = StoryObj<typeof meta>;

// Per story, not meta: decorators compose rather than replace, so a meta
// wrapper would squash the full-scale stories.
const constrained: Story["decorators"] = [
  (Story) => (
    <div className="w-20">
      <Story />
    </div>
  ),
];

export const Unselected: Story = { decorators: constrained };

export const Selected: Story = {
  args: { defaultChecked: true },
  decorators: constrained,
};

export const Disabled: Story = {
  args: { disabled: true },
  decorators: constrained,
};

export const DisabledSelected: Story = {
  args: { disabled: true, defaultChecked: true },
  decorators: constrained,
};

function Scale({
  name,
  checkedValue,
}: {
  name: string;
  checkedValue?: number;
}) {
  return (
    <fieldset>
      <legend className="text-ink text-base font-medium">
        How are you feeling?
      </legend>
      <div className="mt-3 grid grid-cols-6 gap-2">
        {MOOD_OPTIONS.map((option) => (
          <MoodTile
            key={option.value}
            name={name}
            {...option}
            defaultChecked={option.value === checkedValue}
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
  );
}

/** Unselected tiles are identical: a low mood must not look worse. */
export const FullScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-md">
      <Scale name="scale-demo" />
    </div>
  ),
};

/** Checks the accent reads at any position on the scale. */
export const SelectedPositions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-8">
      {[1, 3, 6].map((v) => (
        <Scale key={v} name={`pos-${v}`} checkedValue={v} />
      ))}
    </div>
  ),
};

/** 320px: six tiles still have to fit. */
export const MobileWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="border-line w-[320px] border border-dashed p-3">
      <Scale name="mobile-demo" />
    </div>
  ),
};

/**
 * The behaviour the native-radio decision rests on: one tab stop, arrow keys
 * to move. jsdom cannot test this, so a real browser is the only check.
 */
export const KeyboardNavigation: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Scale name="keyboard-demo" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("radio", { name: "Very low" });
    const second = canvas.getByRole("radio", { name: "Low" });
    const last = canvas.getByRole("radio", { name: "Very good" });

    await userEvent.tab();
    await expect(first).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await expect(second).toBeChecked();
    await expect(second).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    await expect(first).toBeChecked();

    // Wraps to the end rather than stopping.
    await userEvent.keyboard("{ArrowLeft}");
    await expect(last).toBeChecked();

    // Still a single tab stop: tabbing again leaves the group entirely.
    await userEvent.tab();
    await expect(last).not.toHaveFocus();
  },
};

/** A long name must not break the tile, since only screen readers hear it. */
export const LongLabel: Story = {
  args: {
    label: "Slightly low, but better than yesterday morning",
    defaultChecked: true,
  },
  decorators: constrained,
};
