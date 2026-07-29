import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import type { Entry } from "@/lib/data/entries";
import { EntryCard } from "./entry-card";

const TAGS = [
  { id: "t1", name: "exercise", isCustom: false },
  { id: "t2", name: "work", isCustom: false },
];

const base: Entry = {
  id: "e1",
  rating: 5,
  note: "Slept well and got out for a walk before the day started.",
  sleepHours: 7.5,
  exercised: true,
  loggedAt: new Date("2026-07-27T18:52:00.000Z"),
  tags: TAGS,
};

const meta = {
  title: "Entries/EntryCard",
  component: EntryCard,
  args: { entry: base, timeZone: "Europe/London" },
} satisfies Meta<typeof EntryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A card renders an <li>, so it needs a list parent. Per story, never on meta:
// decorators compose, so a meta <ul> would nest inside any story that brings
// its own — which axe flags, correctly.
const inList: Story["decorators"] = [
  (Story) => (
    <ul className="max-w-2xl">
      <Story />
    </ul>
  ),
];

export const Default: Story = { decorators: inList };

export const WithoutNote: Story = {
  decorators: inList,
  args: { entry: { ...base, note: null } },
};

export const WithoutTags: Story = {
  decorators: inList,
  args: { entry: { ...base, tags: [] } },
};

/** Nothing but a mood, which is all the form actually requires. */
export const MoodOnly: Story = {
  decorators: inList,
  args: {
    entry: {
      ...base,
      note: null,
      sleepHours: null,
      exercised: null,
      tags: [],
    },
  },
};

/** null exercised means unanswered, so the card says nothing rather than "No". */
export const UnansweredFactors: Story = {
  decorators: inList,
  args: { entry: { ...base, sleepHours: null, exercised: null } },
};

export const DidNotExercise: Story = {
  decorators: inList,
  args: { entry: { ...base, exercised: false } },
};

/** Clamped to three lines in the list; the detail view shows it all. */
export const LongNote: Story = {
  decorators: inList,
  args: {
    entry: {
      ...base,
      note: Array.from(
        { length: 8 },
        (_, i) =>
          `Paragraph ${i + 1}. A long entry that has to stay a readable card rather than pushing everything else off the screen.`,
      ).join(" "),
    },
  },
};

export const ManyTags: Story = {
  decorators: inList,
  args: {
    entry: {
      ...base,
      tags: [
        "exercise",
        "family",
        "food",
        "friends",
        "health",
        "money",
        "sleep",
        "work",
      ].map((name, i) => ({ id: `m${i}`, name, isCustom: false })),
    },
  },
};

/**
 * The same instant in two zones, one day apart. This is the whole reason the
 * timezone lives on the profile.
 */
export const TimeZoneMatters: Story = {
  decorators: inList,
  parameters: { controls: { disable: true } },
  render: () => {
    const entry = { ...base, loggedAt: new Date("2026-07-28T01:00:00.000Z") };
    return (
      <>
        <li className="text-muted mb-2 list-none text-xs">UTC</li>
        <EntryCard entry={entry} timeZone="UTC" />
        <li className="text-muted mt-4 mb-2 list-none text-xs">
          America/New_York
        </li>
        <EntryCard entry={entry} timeZone="America/New_York" />
      </>
    );
  },
};

export const MobileWidth: Story = {
  decorators: [
    (Story) => (
      <ul className="border-line w-[320px] border border-dashed p-3">
        <Story />
      </ul>
    ),
  ],
};

/**
 * The whole card is clickable, but the accessible name is the mood and time
 * rather than "read more", so a list does not read as identical links.
 */
export const Linked: Story = {
  decorators: inList,
  args: { href: "/dashboard/journal/e1" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link");

    await expect(link).toHaveAttribute("href", "/dashboard/journal/e1");
    await expect(link).toHaveAccessibleName(/Good/);
  },
};
