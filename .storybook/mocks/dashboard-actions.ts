import { fn } from "storybook/test";
import {
  initialEntryFormState,
  type EntryFormState,
} from "@/app/dashboard/form-state";

// Stands in for the real Server Action, which reaches for cookies and the
// database. Stories override the resolved value with mockResolvedValue.
export const createEntryAction = fn(
  async (): Promise<EntryFormState> => initialEntryFormState,
).mockName("createEntryAction");
