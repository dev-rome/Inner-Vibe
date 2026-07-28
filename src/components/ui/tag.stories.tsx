import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Tag, TagCheckbox } from "./tag";
import { MAX_TAG_NAME_LENGTH } from "@/lib/validation/entry";

const SYSTEM_TAGS = [
  "exercise",
  "family",
  "food",
  "friends",
  "health",
  "hobby",
  "money",
  "relationship",
  "sleep",
  "work",
];

const meta = {
  title: "Primitives/Tag",
  component: TagCheckbox,
  args: { label: "work", name: "tagIds", value: "1" },
} satisfies Meta<typeof TagCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

/** No coral: selection is fill, weight and a glyph, never colour alone. */
export const Selected: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledSelected: Story = {
  args: { disabled: true, defaultChecked: true },
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

/** Wrapping is the normal case here, not an edge one. */
export const ManyTagsWrapping: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-md flex-wrap gap-2">
      {SYSTEM_TAGS.map((name, i) => (
        <TagCheckbox
          key={name}
          name="tagIds"
          value={name}
          label={name}
          defaultChecked={i % 3 === 0}
        />
      ))}
    </div>
  ),
};

/** 40 chars is the column cap, checked at 320px where wrapping bites. */
export const LongLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="border-line w-[320px] border border-dashed p-3">
      <div className="flex flex-wrap gap-2">
        <TagCheckbox name="t" value="a" label="a" />
        <TagCheckbox name="t" value="b" label="work" defaultChecked />
        <TagCheckbox
          name="t"
          value="c"
          label={"x".repeat(MAX_TAG_NAME_LENGTH)}
        />
        <TagCheckbox
          name="t"
          value="d"
          label="dinner with my extended family"
          defaultChecked
        />
      </div>
    </div>
  ),
};

/** Unchecked boxes send nothing, which is how a pending tag is discarded. */
export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const out = event.currentTarget.querySelector("output");
        if (out) out.textContent = JSON.stringify(data.getAll("tagIds"));
      }}
    >
      <div className="flex flex-wrap gap-2">
        {["work", "sleep", "food"].map((name, i) => (
          <TagCheckbox
            key={name}
            name="tagIds"
            value={name}
            label={name}
            defaultChecked={i === 0}
          />
        ))}
      </div>
      <button type="submit" className="text-muted text-sm underline">
        Show submitted values
      </button>
      <output className="text-ink font-mono text-xs">[]</output>
    </form>
  ),
};

/** Space toggles, free from the native checkbox. jsdom cannot verify this. */
export const KeyboardToggle: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex gap-2">
      <TagCheckbox name="kb" value="work" label="work" />
      <TagCheckbox name="kb" value="sleep" label="sleep" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const work = canvas.getByRole("checkbox", { name: "work" });
    const sleep = canvas.getByRole("checkbox", { name: "sleep" });

    await userEvent.tab();
    await expect(work).toHaveFocus();

    await userEvent.keyboard(" ");
    await expect(work).toBeChecked();

    // Checkboxes are independent, unlike the mood radios.
    await userEvent.tab();
    await userEvent.keyboard(" ");
    await expect(sleep).toBeChecked();
    await expect(work).toBeChecked();

    await userEvent.keyboard(" ");
    await expect(sleep).not.toBeChecked();
  },
};

/** A disabled chip must not be toggleable by keyboard or pointer. */
export const DisabledIsInert: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TagCheckbox name="off" value="work" label="work" disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tag = canvas.getByRole("checkbox", { name: "work" });

    await expect(tag).toBeDisabled();
    await userEvent.click(tag);
    await expect(tag).not.toBeChecked();
  },
};

export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted mb-2 text-sm">Selectable</p>
        <div className="flex flex-wrap gap-2">
          <TagCheckbox name="d" value="a" label="unselected" />
          <TagCheckbox name="d" value="b" label="selected" defaultChecked />
          <TagCheckbox name="d" value="c" label="disabled" disabled />
          <TagCheckbox
            name="d"
            value="e"
            label="disabled selected"
            disabled
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
