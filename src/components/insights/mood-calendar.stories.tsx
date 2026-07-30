import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { DayMood } from "@/lib/data/insights";
import { MoodCalendar } from "./mood-calendar";
import { CalendarSkeleton } from "@/components/dashboard/skeletons";

function datesFrom(start: string, count: number): string[] {
  const begin = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) =>
    new Date(begin.getTime() + index * 86_400_000).toISOString().slice(0, 10),
  );
}

const dates = datesFrom("2026-07-01", 30);

// Two gaps on purpose: an unlogged day has to read as absence, not as a low
// mood, and that is the whole point of the intensity floor.
const days: DayMood[] = dates
  .filter((_, index) => index !== 5 && index !== 6)
  .map((date, index) => ({
    date,
    average: 1 + ((index * 7) % 6),
    count: index % 5 === 0 ? 2 : 1,
    entryId: index % 5 === 0 ? null : `entry-${index}`,
  }));

const meta = {
  title: "Insights/MoodCalendar",
  component: MoodCalendar,
  args: { days, dates },
  decorators: [
    (Story) => (
      <div className="w-130 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoodCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Month: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Every logged day is a link named in words, not colour alone.
    await expect(
      canvas.getByRole("link", { name: "2 Jul: Low, 1 entry" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "1 Jul: Very low, 2 entries" }),
    ).toBeInTheDocument();

    // A gap is announced rather than skipped over.
    await expect(
      canvas.getByRole("img", { name: "6 Jul: nothing logged" }),
    ).toBeInTheDocument();
  },
};

/** One entry opens it directly; several open the journal filtered to that day. */
export const LinkTargets: Story = {
  args: {
    dates: datesFrom("2026-07-01", 3),
    days: [
      { date: "2026-07-01", average: 5, count: 1, entryId: "abc" },
      { date: "2026-07-02", average: 3, count: 4, entryId: null },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: /1 Jul/ })).toHaveAttribute(
      "href",
      "/dashboard/journal/abc",
    );
    await expect(canvas.getByRole("link", { name: /2 Jul/ })).toHaveAttribute(
      "href",
      "/dashboard/journal?from=2026-07-02&to=2026-07-02",
    );
  },
};

/** A week is one row, and the columns still land on their weekdays. */
export const Week: Story = {
  args: {
    dates: datesFrom("2026-07-23", 7),
    days: datesFrom("2026-07-23", 7).map((date, index) => ({
      date,
      average: 2 + index * 0.5,
      count: 1,
      entryId: `entry-${index}`,
    })),
  },
};

export const NothingLogged: Story = {
  args: { days: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
    await expect(canvas.getAllByRole("img")).toHaveLength(dates.length);
  },
};

export const Loading: Story = {
  render: () => <CalendarSkeleton />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent(/loading/i);
  },
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
