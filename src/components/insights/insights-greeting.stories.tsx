import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { InsightsGreeting } from "./insights-greeting";
import { GreetingSkeleton } from "./insights-skeletons";

const meta = {
  title: "Insights/Greeting",
  component: InsightsGreeting,
  args: {
    summary: { totalEntries: 48, recentEntries: 12, firstLogged: "2026-01-04" },
  },
} satisfies Meta<typeof InsightsGreeting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThisWeek: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "You've logged 12 times this week" }),
    ).toBeInTheDocument();
  },
};

/** Plural agreement, because "1 times" undoes the care everywhere else. */
export const OneEntryThisWeek: Story = {
  args: {
    summary: { totalEntries: 3, recentEntries: 1, firstLogged: "2026-07-20" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "You've logged 1 time this week" }),
    ).toBeInTheDocument();
  },
};

/**
 * A quiet week is not a failed week. The copy points back at what is already
 * there rather than at the gap.
 */
export const QuietWeek: Story = {
  args: {
    summary: { totalEntries: 30, recentEntries: 0, firstLogged: "2026-02-01" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Nothing logged in the last week" }),
    ).toBeInTheDocument();
  },
};

/** The greeting doubles as the empty state, so a first visit still gets one. */
export const FirstVisit: Story = {
  args: {
    summary: { totalEntries: 0, recentEntries: 0, firstLogged: null },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", {
        name: "Your trends will appear here as you log",
      }),
    ).toBeInTheDocument();
  },
};

export const Loading: Story = {
  render: () => <GreetingSkeleton />,
};
