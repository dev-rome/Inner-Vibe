import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import type { ButtonSize, ButtonVariant } from "./button";
import { SubmitButton } from "./submit-button";

const VARIANTS: ButtonVariant[] = ["primary", "secondary"];
const SIZES: ButtonSize[] = ["sm", "md"];

/** Never settles, so the pending state stays on screen to review. */
const neverResolves = () => new Promise<void>(() => {});

const meta = {
  title: "Primitives/SubmitButton",
  component: SubmitButton,
  args: { children: "Save entry", pendingLabel: "Saving…" },
  decorators: [
    (Story) => (
      <form action={neverResolves}>
        <Story />
      </form>
    ),
  ],
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary" } };

export const Small: Story = { args: { size: "sm" } };

/** Native disabled, correct for a genuinely inert button. */
export const Disabled: Story = { args: { disabled: true } };

/** Auth forms use a full-width submit. */
export const FullWidth: Story = {
  args: { className: "w-full" },
  decorators: [
    (Story) => (
      <form action={neverResolves} className="w-[320px]">
        <Story />
      </form>
    ),
  ],
};

export const LongPendingLabel: Story = {
  args: {
    children: "Create account",
    pendingLabel: "Creating your account, this can take a moment…",
  },
};

/** The real pending state, driven by a live submission rather than a prop. */
export const PendingOnSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await expect(button).not.toHaveAttribute("aria-busy");

    await userEvent.click(button);

    await expect(await canvas.findByText("Saving…")).toBeInTheDocument();
    await expect(button).toHaveAttribute("aria-busy", "true");
    // aria-disabled, not disabled, so focus is not thrown to the document body.
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).not.toBeDisabled();
  },
};

/** Enter on a focused submit posts the form, same as a click. */
export const KeyboardSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByText("Saving…")).toBeInTheDocument();
    // Still focusable while busy, which is the point of aria-disabled.
    await expect(button).toHaveFocus();
  },
};

export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  decorators: [],
  render: () => (
    <table className="text-ink border-separate border-spacing-4 text-sm">
      <thead>
        <tr className="text-subtle text-left text-xs">
          <td />
          <th scope="col">Idle</th>
          <th scope="col">Pending</th>
          <th scope="col">Disabled</th>
        </tr>
      </thead>
      <tbody>
        {VARIANTS.flatMap((variant) =>
          SIZES.map((size) => (
            <tr key={`${variant}-${size}`}>
              <th
                scope="row"
                className="text-subtle text-left text-xs font-normal"
              >
                {variant} / {size}
              </th>
              <td>
                <form>
                  <SubmitButton
                    variant={variant}
                    size={size}
                    pendingLabel="Saving…"
                  >
                    Save entry
                  </SubmitButton>
                </form>
              </td>
              <td>
                {/* Its own form, so one submit does not pend the whole grid. */}
                <form action={neverResolves}>
                  <SubmitButton
                    variant={variant}
                    size={size}
                    pendingLabel="Saving…"
                  >
                    Save entry
                  </SubmitButton>
                </form>
              </td>
              <td>
                <form>
                  <SubmitButton
                    variant={variant}
                    size={size}
                    pendingLabel="Saving…"
                    disabled
                  >
                    Save entry
                  </SubmitButton>
                </form>
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  ),
};
