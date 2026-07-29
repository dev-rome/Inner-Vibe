import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { FactorCards } from "./factor-cards";
import { FactorCardsSkeleton } from "./insights-skeletons";

const meta = {
  title: "Insights/FactorCards",
  component: FactorCards,
  args: {
    exercise: [
      { exercised: true, average: 4.6, count: 9 },
      { exercised: false, average: 3.4, count: 12 },
    ],
    sleep: [
      { bucket: "under_6", average: 2.9, count: 6 },
      { bucket: "six_to_eight", average: 4.1, count: 11 },
      { bucket: "eight_plus", average: 4.8, count: 4 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-180 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FactorCards>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The accent marks exactly one row per card, and only the higher one. */
export const Populated: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("higher")).toHaveLength(2);
    await expect(
      canvas.getByRole("img", { name: /Days you moved: average 4.6/ }),
    ).toBeInTheDocument();
  },
};

/**
 * Two entries is not a finding. The card still shows what it has, labelled as
 * too thin, and marks nothing as higher.
 */
export const TooFewToCompare: Story = {
  args: {
    exercise: [
      { exercised: true, average: 5.0, count: 2 },
      { exercised: false, average: 2.0, count: 1 },
    ],
    sleep: [{ bucket: "six_to_eight", average: 4.0, count: 2 }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("higher")).not.toBeInTheDocument();
    await expect(canvas.getAllByText(/too few to compare/)).not.toHaveLength(0);
  },
};

/** One side recorded is not a comparison either, however many entries it has. */
export const OneSideOnly: Story = {
  args: {
    exercise: [{ exercised: true, average: 4.4, count: 20 }],
    sleep: [{ bucket: "eight_plus", average: 4.2, count: 15 }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("higher")).not.toBeInTheDocument();
  },
};

export const NothingRecorded: Story = {
  args: { exercise: [], sleep: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByText("Nothing recorded for this yet."),
    ).toHaveLength(2);
  },
};

export const Loading: Story = {
  args: { exercise: [], sleep: [] },
  render: () => <FactorCardsSkeleton />,
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
