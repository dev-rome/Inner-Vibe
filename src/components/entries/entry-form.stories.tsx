import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { createEntryAction } from "@/app/dashboard/actions";
import {
  emptySubmission,
  initialEntryFormState,
  readSubmission,
} from "@/app/dashboard/form-state";
import type { EntryFormState } from "@/app/dashboard/form-state";
import type { Tag } from "@/lib/data/tags";
import { Card } from "@/components/ui/card";
import { EntryForm } from "./entry-form";

// Aliased to a spy in .storybook/main.ts; the real module needs cookies.
const action = createEntryAction as unknown as ReturnType<typeof fn>;

const TAGS: Tag[] = [
  "exercise",
  "family",
  "food",
  "friends",
  "health",
  "sleep",
  "work",
].map((name, i) => ({ id: `sys-${i}`, name, isCustom: false }));

const saved: EntryFormState = {
  status: "success",
  message: "Entry saved.",
  fieldErrors: {},
  savedAt: Date.now(),
  values: emptySubmission,
};

const meta = {
  title: "Entries/EntryForm",
  component: EntryForm,
  args: { tags: TAGS },
  decorators: [
    (Story) => (
      <Card className="max-w-2xl">
        <Story />
      </Card>
    ),
  ],
  beforeEach: () => {
    action.mockResolvedValue(initialEntryFormState);
  },
} satisfies Meta<typeof EntryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MobileWidth: Story = {
  decorators: [
    (Story) => (
      <Card className="w-[320px]">
        <Story />
      </Card>
    ),
  ],
};

/** Every field error at once, which no single real submission produces. */
export const WithFieldErrors: Story = {
  beforeEach: () => {
    action.mockResolvedValue({
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: {
        rating: ["Choose how you're feeling."],
        sleepHours: ["Enter sleep as a number of hours."],
        note: ["Keep the note under 1000 characters."],
      },
      savedAt: null,
      values: emptySubmission,
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /save entry/i }));

    await expect(
      await canvas.findByText("Choose how you're feeling."),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("group", { name: /how are you feeling/i }),
    ).toHaveAttribute("aria-invalid", "true");
  },
};

/** A save clears the form, including pending tags and the note counter. */
export const ClearsAfterSaving: Story = {
  beforeEach: () => {
    action.mockResolvedValue(saved);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("radio", { name: "Good" }));
    await userEvent.type(
      canvas.getByLabelText(/want to say more/i),
      "A decent day.",
    );
    await userEvent.type(canvas.getByLabelText(/add a new tag/i), "baking");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));

    await userEvent.click(canvas.getByRole("button", { name: /save entry/i }));

    await expect(await canvas.findByText("Entry saved.")).toBeInTheDocument();
    await expect(canvas.getByLabelText(/want to say more/i)).toHaveValue("");
    await expect(canvas.getByRole("radio", { name: "Good" })).not.toBeChecked();
    await expect(
      canvas.queryByRole("checkbox", { name: "baking" }),
    ).not.toBeInTheDocument();
  },
};

/** A failed save must keep what the user typed. */
export const KeepsInputOnFailure: Story = {
  beforeEach: () => {
    // Mirrors the real action, which echoes the submission back so the form
    // can restore itself after React resets it.
    action.mockImplementation(async (_prev: unknown, formData: FormData) => ({
      status: "error" as const,
      message: "Something went wrong saving that. Please try again.",
      fieldErrors: {},
      savedAt: null,
      values: readSubmission(formData),
    }));
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("radio", { name: "Good" }));
    await userEvent.type(canvas.getByLabelText(/want to say more/i), "Kept.");
    await userEvent.click(canvas.getByRole("button", { name: /save entry/i }));

    await expect(
      await canvas.findByText(/something went wrong/i),
    ).toBeInTheDocument();
    await expect(canvas.getByLabelText(/want to say more/i)).toHaveValue(
      "Kept.",
    );
    await expect(canvas.getByRole("radio", { name: "Good" })).toBeChecked();
  },
};

/**
 * A radio cannot be deselected, so without a third option answering once was
 * permanent. This walks the round trip the form previously could not express.
 */
export const ExerciseCanReturnToUnrecorded: Story = {
  args: {
    initialValues: { ...emptySubmission, rating: "5", exercised: "yes" },
    clearOnSuccess: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const unrecorded = canvas.getByRole("radio", { name: "Not recorded" });
    const yes = canvas.getByRole("radio", { name: "Yes" });

    await expect(yes).toBeChecked();

    await userEvent.click(unrecorded);
    await expect(unrecorded).toBeChecked();
    await expect(yes).not.toBeChecked();

    // "" is what parseCreateEntryForm reads back as null.
    await expect(unrecorded).toHaveAttribute("value", "");
  },
};

/** A blank form states the stored value rather than leaving it implied. */
export const ExerciseDefaultsToUnrecorded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("radio", { name: "Not recorded" }),
    ).toBeChecked();
    await expect(canvas.getByRole("radio", { name: "Yes" })).not.toBeChecked();
    await expect(canvas.getByRole("radio", { name: "No" })).not.toBeChecked();
  },
};
