import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tag, TagCheckbox } from "./tag";

const meta = {
  title: "Primitives/Tag",
  component: TagCheckbox,
  args: { label: "work", name: "tagIds", value: "1" },
} satisfies Meta<typeof TagCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

/**
 * No coral. Tags are not on the accent allowlist, so the selected state is
 * carried by fill, border weight, medium text and a check glyph. The glyph
 * also means selection is not signalled by colour alone.
 */
export const Selected: Story = {
  args: { defaultChecked: true },
};

export const ReadOnly: Story = {
  render: () => (
    <ul className="flex gap-1.5">
      {["exercise", "reading", "work"].map((name) => (
        <li key={name}>
          <Tag>{name}</Tag>
        </li>
      ))}
    </ul>
  ),
};

/**
 * Selected and unselected side by side, which is the comparison that matters:
 * a pending tag the user just typed has to be indistinguishable from one that
 * already existed, or the difference reads as a bug.
 */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted mb-2 text-sm">Selectable</p>
        <div className="flex flex-wrap gap-2">
          <TagCheckbox name="demo" value="a" label="unselected" />
          <TagCheckbox name="demo" value="b" label="selected" defaultChecked />
          <TagCheckbox
            name="demo"
            value="c"
            label="pending (new)"
            defaultChecked
          />
        </div>
      </div>

      <div>
        <p className="text-muted mb-2 text-sm">Read-only</p>
        <div className="flex flex-wrap gap-1.5">
          <Tag>exercise</Tag>
          <Tag>a much longer tag name</Tag>
        </div>
      </div>
    </div>
  ),
};
