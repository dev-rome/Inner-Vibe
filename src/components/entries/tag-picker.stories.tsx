import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { Tag } from "@/lib/data/tags";
import { TagPicker } from "./tag-picker";

const SYSTEM_TAGS: Tag[] = [
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
].map((name, i) => ({ id: `sys-${i}`, name, isCustom: false }));

const WITH_CUSTOM: Tag[] = [
  ...SYSTEM_TAGS,
  { id: "own-1", name: "gardening", isCustom: true },
];

const meta = {
  title: "Entries/TagPicker",
  component: TagPicker,
  args: { tags: SYSTEM_TAGS },
} satisfies Meta<typeof TagPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Per story, never on meta: decorators compose, so a form on meta would nest
// inside any story supplying its own.
const inForm: Story["decorators"] = [
  (Story) => (
    <form className="max-w-md">
      <Story />
    </form>
  ),
];

export const Default: Story = { decorators: inForm };

export const WithCustomTags: Story = {
  args: { tags: WITH_CUSTOM },
  decorators: inForm,
};

export const NoTagsYet: Story = { args: { tags: [] }, decorators: inForm };

/** 320px, where the chip rows wrap hardest. */
export const MobileWidth: Story = {
  decorators: [
    (Story) => (
      <form className="border-line w-[320px] border border-dashed p-3">
        <Story />
      </form>
    ),
  ],
};

/** A new name is held as a pending tag, not created until the entry saves. */
export const AddingANewTag: Story = {
  decorators: inForm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/add a new tag/i), "baking");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));

    const pending = canvas.getByRole("checkbox", { name: "baking" });
    await expect(pending).toBeChecked();
    await expect(pending).toHaveAttribute("name", "newTagNames");
  },
};

/** Typing an existing name ticks that tag instead of duplicating it. */
export const ReusesAnExistingTag: Story = {
  decorators: inForm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/add a new tag/i), "WORK");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));

    await expect(canvas.getByRole("checkbox", { name: "work" })).toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      /already in your tags/i,
    );
  },
};

/** Unticking a pending tag discards it, same gesture as any other chip. */
export const DiscardingAPendingTag: Story = {
  decorators: inForm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/add a new tag/i), "baking");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "baking" }));

    await expect(
      canvas.queryByRole("checkbox", { name: "baking" }),
    ).not.toBeInTheDocument();
  },
};

/** Enter adds the tag rather than submitting the half-written entry. */
export const EnterDoesNotSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let submitted = false;
    canvasElement.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
    });

    await userEvent.type(
      canvas.getByLabelText(/add a new tag/i),
      "baking{Enter}",
    );

    await expect(
      canvas.getByRole("checkbox", { name: "baking" }),
    ).toBeChecked();
    await expect(submitted).toBe(false);
  },
};
