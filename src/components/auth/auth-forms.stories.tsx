import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { login, signup } from "@/app/(auth)/actions";
import { initialAuthFormState } from "@/app/(auth)/form-state";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

// Aliased to spies in .storybook/main.ts; the real module needs cookies.
const loginMock = login as unknown as ReturnType<typeof fn>;
const signupMock = signup as unknown as ReturnType<typeof fn>;

const meta = {
  title: "Auth/Forms",
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    loginMock.mockResolvedValue(initialAuthFormState);
    signupMock.mockResolvedValue(initialAuthFormState);
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Login: Story = { render: () => <LoginForm /> };

export const Signup: Story = { render: () => <SignupForm /> };

/** Deliberately vague, so the form is not an account-enumeration oracle. */
export const LoginRejected: Story = {
  render: () => <LoginForm />,
  beforeEach: () => {
    loginMock.mockResolvedValue({
      status: "error",
      message: "That email and password don't match an account.",
      fieldErrors: {},
      email: "someone@example.com",
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Email"), "someone@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "wrong-password");
    await userEvent.click(canvas.getByRole("button", { name: /log in/i }));

    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent(/don't match an account/i);
    // Email survives the round trip; the password never does.
    await expect(canvas.getByLabelText("Email")).toHaveValue(
      "someone@example.com",
    );
    await expect(canvas.getByLabelText("Password")).toHaveValue("");
  },
};

export const LoginFieldErrors: Story = {
  render: () => <LoginForm />,
  beforeEach: () => {
    loginMock.mockResolvedValue({
      status: "error",
      message: null,
      fieldErrors: {
        email: ["Enter a valid email address."],
        password: ["Enter your password."],
      },
      email: "not-an-email",
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "x@y.co");
    await userEvent.type(canvas.getByLabelText("Password"), "x");
    await userEvent.click(canvas.getByRole("button", { name: /log in/i }));

    await expect(
      await canvas.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    await expect(canvas.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
};

/** Shown whether or not the address was already registered. */
export const SignupCheckEmail: Story = {
  render: () => <SignupForm />,
  beforeEach: () => {
    signupMock.mockResolvedValue({
      status: "check-email",
      message: null,
      fieldErrors: {},
      email: "someone@example.com",
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Email"), "someone@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "a-good-password");
    await userEvent.click(
      canvas.getByRole("button", { name: /create account/i }),
    );

    await expect(
      await canvas.findByText("Check your inbox"),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "someone@example.com",
    );
  },
};

export const SignupWeakPassword: Story = {
  render: () => <SignupForm />,
  beforeEach: () => {
    signupMock.mockResolvedValue({
      status: "error",
      message: null,
      fieldErrors: { password: ["Use at least 8 characters."] },
      email: "someone@example.com",
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "someone@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "short");
    await userEvent.click(
      canvas.getByRole("button", { name: /create account/i }),
    );

    await expect(
      await canvas.findByText("Use at least 8 characters."),
    ).toBeInTheDocument();
  },
};
