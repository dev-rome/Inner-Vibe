import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { Entry } from "@/lib/data/entries";
import { EntryList } from "./entry-list";
import { EntryListSkeleton } from "./entry-skeleton";

function entry(index: number, overrides: Partial<Entry> = {}): Entry {
  return {
    id: `e${index}`,
    rating: ((index % 6) + 1) as number,
    note: index % 3 === 0 ? null : `Note for entry ${index}.`,
    sleepHours: index % 2 === 0 ? 7.5 : null,
    exercised: index % 2 === 0 ? true : null,
    loggedAt: new Date(Date.UTC(2026, 6, 27 - index, 18, 52)),
    tags:
      index % 4 === 0
        ? []
        : [{ id: `t${index}`, name: "work", isCustom: false }],
    ...overrides,
  };
}

const meta = {
  title: "Entries/EntryList",
  component: EntryList,
  args: {
    entries: [1, 2, 3, 4].map((i) => entry(i)),
    timeZone: "Europe/London",
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EntryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const Linked: Story = { args: { linkToDetail: true } };

/** First run. The copy points at the form rather than just stating a fact. */
export const Empty: Story = {
  args: { entries: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No entries yet.")).toBeInTheDocument();
  },
};

/**
 * A filter matching nothing is a different situation from having no entries,
 * and telling someone "log your first entry" when they have two hundred is
 * both wrong and slightly insulting.
 */
export const EmptyAfterFiltering: Story = {
  args: {
    entries: [],
    empty: (
      <>
        <p className="text-ink">Nothing matches those filters.</p>
        <p className="text-muted mt-1 text-sm">
          Try widening the range, or clear them to see everything.
        </p>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("Nothing matches those filters."),
    ).toBeInTheDocument();
  },
};

export const SingleEntry: Story = { args: { entries: [entry(1)] } };

/**
 * The skeleton is aria-hidden with a live region beside it: the shape of
 * pretend content is noise to a screen reader, but "still loading" is not.
 */
export const Loading: Story = {
  args: { entries: [] },
  render: () => <EntryListSkeleton />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent(/loading/i);
    // The placeholder cards themselves must not reach assistive tech.
    await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
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
