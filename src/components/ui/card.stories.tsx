import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, EmptyState } from "./card";
import { Tag } from "./tag";

const meta = {
  title: "Primitives/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <h2 className="text-ink text-xl">Check your inbox</h2>
      <p className="text-muted mt-2 text-sm">
        A confirmation link is on its way. Open it to finish setting up your
        account.
      </p>
    </Card>
  ),
};

/** Dashed, so it reads as a placeholder rather than as loaded content. */
export const Empty: Story = {
  render: () => (
    <EmptyState className="max-w-md">
      <p className="text-ink">No entries yet.</p>
      <p className="text-muted mt-1 text-sm">
        Log how you are feeling above. One entry is enough to start.
      </p>
    </EmptyState>
  ),
};

/** As list items, so list content keeps its semantics. */
export const AsListItems: Story = {
  render: () => (
    <ul className="grid max-w-2xl gap-4 sm:grid-cols-2">
      {["Private by default", "Seconds to log"].map((title) => (
        <Card as="li" key={title}>
          <h2 className="text-ink text-base font-medium">{title}</h2>
          <p className="text-muted mt-2 text-sm">
            Supporting copy for the point above.
          </p>
        </Card>
      ))}
    </ul>
  ),
};

/** The one responsive card property: p-4 below sm, p-6 above. */
export const Responsive: Story = {
  render: () => (
    <Card className="max-w-md">
      <p className="text-ink text-sm">
        p-4 below the sm breakpoint, p-6 above it.
      </p>
    </Card>
  ),
};

/** Definition comes from the border. Shadow is for modals and dropdowns. */
export const Elevation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      {[
        { label: "None (default)", className: "" },
        { label: "shadow-sm", className: "shadow-sm" },
        {
          label: "shadow-md — modals and dropdowns only",
          className: "shadow-md",
        },
      ].map(({ label, className }) => (
        <Card key={label} className={className}>
          <p className="text-ink text-sm">{label}</p>
        </Card>
      ))}
    </div>
  ),
};

/** A realistic composition, to check the primitives sit together. */
export const WithContent: Story = {
  render: () => (
    <Card as="li" className="max-w-md list-none">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">
          {"\u{1F60A}"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-ink font-medium">Good</p>
            <time className="text-subtle font-mono text-xs tabular-nums">
              Mon 27 Jul, 18:52
            </time>
          </div>
          <p className="text-ink mt-2 text-lg">
            Slept well and got out for a walk.
          </p>
          <p className="text-subtle mt-2 text-xs">
            <span className="font-mono tabular-nums">7.5</span>h sleep ·
            Exercised
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {["exercise", "reading"].map((name) => (
              <li key={name}>
                <Tag>{name}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  ),
};
