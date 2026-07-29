import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { RangeTabs } from "./range-tabs";

const meta = {
  title: "Insights/RangeTabs",
  component: RangeTabs,
  // The tabs navigate rather than hold state, so they need an App Router to
  // push into. This is the addon's mock; the assertions below are about focus
  // and naming, not about where it navigates.
  parameters: { nextjs: { appDirectory: true } },
  args: {
    current: "week",
    children: (
      <p className="text-muted mt-6 text-sm">
        The selected range renders here.
      </p>
    ),
  },
} satisfies Meta<typeof RangeTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Week: Story = {};

export const Month: Story = { args: { current: "month" } };

export const Year: Story = { args: { current: "year" } };

/**
 * The roving part: the group is one tab stop, so only the selected tab is
 * reachable by Tab and the other two are reached with arrow keys.
 */
export const RovingTabindex: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    await expect(tabs[0]).toHaveAttribute("tabindex", "0");
    await expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    await expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  },
};

/** Arrow keys move focus and wrap at the ends; Home and End jump. */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[1]).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect(tabs[2]).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[0]).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    await expect(tabs[2]).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect(tabs[0]).toHaveFocus();
  },
};

/** The panel names itself by the selected tab, so the pairing is announced. */
export const PanelIsLabelled: Story = {
  args: { current: "month" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName("Month");
  },
};
