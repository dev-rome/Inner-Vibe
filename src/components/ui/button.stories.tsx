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

/**
 * aria-disabled, not disabled. A disabled button leaves the tab order, so a
 * keyboard user who just pressed it loses focus to the document body with no
 * explanation. This stays focusable and announced.
 */
export const Disabled: Story = {
  args: { "aria-disabled": true },
};

/**
 * What SubmitButton renders while its form is in flight. Shown here with the
 * label forced, because useFormStatus only reports pending during a real
 * submission and a story has no server to wait on.
 */
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

/**
 * The full grid, which is the point of building primitives in isolation: you
 * review the set against a checklist instead of discovering a missing state
 * when a page happens to need it.
 *
 * Hover and active are absent because they cannot be forced from a story
 * without a pseudo-state addon. Hover the live examples above.
 */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="text-ink border-separate border-spacing-4 text-sm">
      <thead>
        <tr className="text-subtle text-left text-xs">
          {/* The corner of a matrix labels nothing, so it is a td. An empty
              th is an axe violation, and the a11y panel caught it here. */}
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
