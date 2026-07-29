// Kept out of actions.ts: a "use server" module may only export async
// functions, so a plain object export there fails the build.
export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSettingsFormState: SettingsFormState = {
  status: "idle",
  message: null,
};
