import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { TrendPoint } from "@/lib/data/insights";
import { MoodTrend } from "./mood-trend";
import { TrendSkeleton } from "@/components/dashboard/skeletons";

const week: TrendPoint[] = [
  { date: "2026-07-23", average: 3.0, count: 1, note: "Long day." },
  { date: "2026-07-24", average: 4.5, count: 2, note: null },
  { date: "2026-07-25", average: 4.0, count: 1, note: null },
  { date: "2026-07-26", average: 2.5, count: 2, note: null },
  { date: "2026-07-27", average: 5.0, count: 1, note: "Slept properly." },
  { date: "2026-07-28", average: 5.5, count: 1, note: null },
  { date: "2026-07-29", average: 4.0, count: 3, note: null },
];

const meta = {
  title: "Insights/MoodTrend",
  component: MoodTrend,
  args: { points: week, range: "week" },
  decorators: [
    // ResponsiveContainer measures its parent, so the parent needs a size.
    (Story) => (
      <div className="w-160 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoodTrend>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The SVG carries no meaning for a screen reader, so the same numbers are also
 * a table. This asserts the table, since that is the part that has to be right.
 */
export const Week: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table");
    await expect(
      within(table).getByRole("rowheader", { name: "23 Jul" }),
    ).toBeInTheDocument();
    await expect(within(table).getAllByRole("row")).toHaveLength(
      week.length + 1,
    );
  },
};

export const Month: Story = {
  args: {
    range: "month",
    points: Array.from({ length: 30 }, (_, index) => ({
      date: `2026-07-${String(index + 1).padStart(2, "0")}`,
      average: 3 + Math.sin(index / 3) * 1.6,
      count: 1,
      note: null,
    })),
  },
};

/** Yearly points cover a whole week each, so the caption has to say so. */
export const Year: Story = {
  args: {
    range: "year",
    points: Array.from({ length: 52 }, (_, index) => ({
      date: new Date(Date.UTC(2025, 7, 4 + index * 7))
        .toISOString()
        .slice(0, 10),
      average: 3 + Math.cos(index / 6),
      count: 5,
      note: null,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("table")).toHaveAccessibleName(/per week/i);
  },
};

/** A single point still has to draw something rather than an empty frame. */
export const SinglePoint: Story = {
  args: { points: [week[0]] },
};

export const NoEntriesInRange: Story = {
  args: { points: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("No entries in this range yet."),
    ).toBeInTheDocument();
  },
};

export const Loading: Story = {
  render: () => <TrendSkeleton />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent(/loading/i);
  },
};
