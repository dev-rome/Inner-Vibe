import type { AuthFieldErrors } from "@/lib/validation/auth";

// Kept out of actions.ts: a "use server" module may only export async
// functions, so a plain object export there fails the build.
export type AuthFormState = {
  status: "idle" | "error" | "check-email";
  message: string | null;
  fieldErrors: AuthFieldErrors;
  email: string;
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  email: "",
};
