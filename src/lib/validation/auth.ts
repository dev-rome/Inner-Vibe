import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;

// No length rule on login. Accounts may predate the policy, and enforcing it
// here only tells an attacker what the policy is.
export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    ),
});

export type AuthFieldErrors = {
  email?: string[];
  password?: string[];
};
