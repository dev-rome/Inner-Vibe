import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input, Textarea } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  args: { placeholder: "Add your own", className: "w-64" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "work" },
};

/** Tabular figures stop a column of hours jittering as digit widths change. */
export const Numeric: Story = {
  args: {
    type: "number",
    defaultValue: "7.5",
    className: "w-28 font-mono tabular-nums",
  },
};

/** The border turns red too, tying the message to the field it belongs to. */
export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    "aria-describedby": "demo-error",
    defaultValue: "eight",
  },
  render: (args) => (
    <div>
      <label htmlFor="demo-invalid" className="text-muted block text-sm">
        Hours slept
      </label>
      <Input id="demo-invalid" {...args} className="mt-1.5 w-64" />
      <p id="demo-error" className="text-status-error mt-1.5 text-sm">
        Enter sleep as a number of hours.
      </p>
    </div>
  ),
};

/** Sunken surface and dimmed text, so it reads as inert rather than empty. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "work" },
};

export const AsTextarea: Story = {
  render: () => (
    <Textarea
      rows={4}
      className="w-80 text-lg"
      placeholder="Want to say more?"
    />
  ),
};

/** Labelled, because an unlabelled input is an axe violation. */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      {[
        { id: "s-default", label: "Default", props: {} },
        { id: "s-value", label: "With value", props: { defaultValue: "work" } },
        {
          id: "s-invalid",
          label: "Invalid",
          props: { "aria-invalid": true, defaultValue: "eight" },
        },
        {
          id: "s-disabled",
          label: "Disabled",
          props: { disabled: true, defaultValue: "work" },
        },
        {
          id: "s-numeric",
          label: "Numeric",
          props: {
            type: "number",
            defaultValue: "7.5",
            className: "mt-1.5 w-28 font-mono tabular-nums",
          },
        },
      ].map(({ id, label, props }) => (
        <div key={id}>
          <label htmlFor={id} className="text-muted block text-sm">
            {label}
          </label>
          <Input
            id={id}
            placeholder="Add your own"
            className="mt-1.5 w-full"
            {...props}
          />
        </div>
      ))}

      <div>
        <label htmlFor="s-textarea" className="text-muted block text-sm">
          Textarea
        </label>
        <Textarea
          id="s-textarea"
          rows={3}
          className="mt-1.5 w-full"
          placeholder="Want to say more?"
        />
      </div>
    </div>
  ),
};
