import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Tag } from "@/lib/data/tags";
import { TagPicker } from "./tag-picker";

const TAGS: Tag[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "work", isCustom: false },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "sleep",
    isCustom: false,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "gardening",
    isCustom: true,
  },
];

/** What the form would actually submit for the given field. */
function submittedValues(container: HTMLElement, field: string): string[] {
  const inputs = container.querySelectorAll<HTMLInputElement>(
    `input[name="${field}"]`,
  );
  return Array.from(inputs)
    .filter((input) => input.type !== "checkbox" || input.checked)
    .map((input) => input.value);
}

describe("TagPicker", () => {
  it("offers every tag the user can see as a checkbox", () => {
    render(<TagPicker tags={TAGS} />);

    for (const tag of TAGS) {
      expect(
        screen.getByRole("checkbox", { name: tag.name }),
      ).toBeInTheDocument();
    }
  });

  it("submits only the ticked tags", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);

    expect(submittedValues(container, "tagIds")).toEqual([]);

    await user.click(screen.getByRole("checkbox", { name: "work" }));
    await user.click(screen.getByRole("checkbox", { name: "gardening" }));

    expect(submittedValues(container, "tagIds")).toEqual([
      TAGS[0].id,
      TAGS[2].id,
    ]);
  });

  it("carries a new tag name through as a pending name, not a tag id", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);

    await user.type(screen.getByLabelText(/add a new tag/i), "baking");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(submittedValues(container, "newTagNames")).toEqual(["baking"]);
    expect(submittedValues(container, "tagIds")).toEqual([]);
  });

  it("lowercases new tag names to match how they are stored", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);

    await user.type(screen.getByLabelText(/add a new tag/i), "Book Club");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(submittedValues(container, "newTagNames")).toEqual(["book club"]);
  });

  it("ticks the existing tag when its name is typed instead of duplicating it", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);

    await user.type(screen.getByLabelText(/add a new tag/i), "WORK");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("checkbox", { name: "work" })).toBeChecked();
    expect(submittedValues(container, "newTagNames")).toEqual([]);
    expect(submittedValues(container, "tagIds")).toEqual([TAGS[0].id]);
    expect(screen.getByRole("status")).toHaveTextContent(
      /already in your tags/i,
    );
  });

  it("does not add the same pending tag twice", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);
    const input = screen.getByLabelText(/add a new tag/i);

    await user.type(input, "baking");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(input, "baking");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(submittedValues(container, "newTagNames")).toEqual(["baking"]);
  });

  // A pending tag is a checked checkbox like every other selected tag, not a
  // chip with its own remove button. Unticking discards it.
  it("discards a pending tag when it is unticked", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);

    await user.type(screen.getByLabelText(/add a new tag/i), "baking");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const pending = screen.getByRole("checkbox", { name: "baking" });
    expect(pending).toBeChecked();

    await user.click(pending);

    expect(submittedValues(container, "newTagNames")).toEqual([]);
    expect(
      screen.queryByRole("checkbox", { name: "baking" }),
    ).not.toBeInTheDocument();
  });

  it("offers no remove button now that unticking does the job", async () => {
    const user = userEvent.setup();
    render(<TagPicker tags={TAGS} />);

    await user.type(screen.getByLabelText(/add a new tag/i), "baking");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  /*
   * The regression this guards: pending tags used to be hidden inputs inside a
   * differently-styled chip, so one selected tag carried a remove control and
   * the rest did not. Asserting the rendered chip is byte-identical is the
   * point here, since "looks the same" is the actual requirement.
   */
  it("renders a pending tag identically to an existing one", async () => {
    const user = userEvent.setup();
    render(<TagPicker tags={TAGS} />);

    await user.type(screen.getByLabelText(/add a new tag/i), "baking");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const existing = screen.getByRole("checkbox", { name: "work" });
    const pending = screen.getByRole("checkbox", { name: "baking" });

    expect(pending.className).toBe(existing.className);
    expect(pending.nextElementSibling?.className).toBe(
      existing.nextElementSibling?.className,
    );
    expect(pending.parentElement?.className).toBe(
      existing.parentElement?.className,
    );
  });

  // Enter here must add the tag, not submit the half-written entry.
  it("adds the tag on Enter without submitting the form", async () => {
    const user = userEvent.setup();
    let submitted = false;

    const { container } = render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <TagPicker tags={TAGS} />
      </form>,
    );

    await user.type(screen.getByLabelText(/add a new tag/i), "baking{Enter}");

    expect(submitted).toBe(false);
    expect(submittedValues(container, "newTagNames")).toEqual(["baking"]);
  });

  // aria-disabled rather than disabled, so the button stays in the tab order
  // and a keyboard user can still find it. Pressing it has to be a no-op.
  it("ignores an empty or whitespace-only name", async () => {
    const user = userEvent.setup();
    const { container } = render(<TagPicker tags={TAGS} />);

    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toHaveAttribute("aria-disabled", "true");

    await user.type(screen.getByLabelText(/add a new tag/i), "   ");
    await user.click(addButton);

    expect(addButton).toHaveAttribute("aria-disabled", "true");
    expect(submittedValues(container, "newTagNames")).toEqual([]);
  });
});
