import { fn } from "storybook/test";
import {
  initialAuthFormState,
  type AuthFormState,
} from "@/app/(auth)/form-state";

export const login = fn(
  async (): Promise<AuthFormState> => initialAuthFormState,
).mockName("login");

export const signup = fn(
  async (): Promise<AuthFormState> => initialAuthFormState,
).mockName("signup");

export const signout = fn(async (): Promise<void> => {}).mockName("signout");

export const signInWithGoogle = fn(async (): Promise<void> => {}).mockName(
  "signInWithGoogle",
);
