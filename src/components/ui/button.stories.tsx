import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Button,
  ButtonLabel,
  type ButtonSize,
  type ButtonVariant,
} from "./button";

const VARIANTS: ButtonVariant[] = ["primary", "secondary"];
const SIZES: ButtonSize[] = ["sm", "md"];

const meta = {
  title: "Primitives/Button",
  component: Button,
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
    children: { control: "text" },
  },
  args: {
    variant: "primary",
    size: "md",
    children: "Save entry",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

/** Matches input padding, so a button beside a field lines up with it. */
export const Small: Story = {
  args: { size: "sm", children: "Add" },
};

/** aria-disabled, so the button stays focusable and announced. */
export const Disabled: Story = {
  args: { "aria-disabled": true },
};

/** Forced, since useFormStatus needs a real submission. See SubmitButton. */
export const Loading: Story = {
  args: { "aria-disabled": true, "aria-busy": true },
  render: (args) => (
    <Button {...args}>
      <ButtonLabel pending pendingLabel="Saving…">
        Save entry
      </ButtonLabel>
    </Button>
  ),
};

/** Hover and active are absent: they need a pseudo-state addon to force. */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="text-ink border-separate border-spacing-4 text-sm">
      <thead>
        <tr className="text-subtle text-left text-xs">
          {/* A matrix corner labels nothing, so td. An empty th fails axe. */}
          <td />
          <th scope="col">Default</th>
          <th scope="col">Disabled</th>
          <th scope="col">Loading</th>
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
                <Button variant={variant} size={size}>
                  Save entry
                </Button>
              </td>
              <td>
                <Button variant={variant} size={size} aria-disabled>
                  Save entry
                </Button>
              </td>
              <td>
                <Button variant={variant} size={size} aria-disabled aria-busy>
                  <ButtonLabel pending pendingLabel="Saving…">
                    Save entry
                  </ButtonLabel>
                </Button>
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  ),
};
