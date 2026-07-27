import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary"],
    },
    children: { control: "text" },
  },
  args: {
    variant: "primary",
    children: "Save entry",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
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
 * Every state in one frame, which is the point of building primitives in
 * isolation: you review the set against a checklist instead of discovering a
 * missing state when a page happens to need it.
 *
 * Hover and active are not shown here because they cannot be forced from a
 * story without a pseudo-state addon. Hover the live examples above.
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
        </tr>
      </thead>
      <tbody>
        {(["primary", "secondary"] as const).map((variant) => (
          <tr key={variant}>
            <th
              scope="row"
              className="text-subtle text-left text-xs font-normal"
            >
              {variant}
            </th>
            <td>
              <Button variant={variant}>Save entry</Button>
            </td>
            <td>
              <Button variant={variant} aria-disabled>
                Save entry
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
