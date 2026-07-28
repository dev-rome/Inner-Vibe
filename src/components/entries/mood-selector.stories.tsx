import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { MoodSelector } from "./mood-selector";

const meta = {
  title: "Entries/MoodSelector",
  component: MoodSelector,
  args: { name: "rating" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoodSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Nothing preselected, so no mood is the default answer. */
export const WithError: Story = {
  args: { hasError: true, errorId: "rating-error" },
  render: (args) => (
    <div>
      <MoodSelector {...args} />
      <p id="rating-error" className="text-status-error mt-1.5 text-sm">
        Choose how you&apos;re feeling.
      </p>
    </div>
  ),
};

export const MobileWidth: Story = {
  decorators: [
    (Story) => (
      <div className="border-line w-[320px] border border-dashed p-3">
        <Story />
      </div>
    ),
  ],
};

/** The group is one tab stop and arrow keys move within it. */
export const KeyboardSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: /how are you feeling/i });
    await expect(group).toBeInTheDocument();

    await userEvent.tab();
    await expect(canvas.getByRole("radio", { name: "Very low" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(
      canvas.getByRole("radio", { name: "Slightly low" }),
    ).toBeChecked();
  },
};

/** The error wiring a screen reader actually follows. */
export const ErrorIsAnnounced: Story = {
  args: { hasError: true, errorId: "rating-error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: /how are you feeling/i });

    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAttribute("aria-describedby", "rating-error");
  },
};
