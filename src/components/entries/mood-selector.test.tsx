import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOOD_OPTIONS } from "@/lib/moods";
import { MoodSelector } from "./mood-selector";

describe("MoodSelector", () => {
  it("exposes the scale as a single named group", () => {
    render(<MoodSelector name="rating" />);

    expect(
      screen.getByRole("group", { name: /how are you feeling/i }),
    ).toBeInTheDocument();
  });

  // Querying by the exact label only passes while the emoji is aria-hidden.
  // Drop that and the accessible name becomes "disappointed face, very low".
  it.each(MOOD_OPTIONS)(
    "names rating $value by its label, not its emoji",
    (option) => {
      render(<MoodSelector name="rating" />);

      const radio = screen.getByRole("radio", { name: option.label });
      expect(radio).toHaveAttribute("value", String(option.value));
    },
  );

  it("renders one radio per point on the scale", () => {
    render(<MoodSelector name="rating" />);
    expect(screen.getAllByRole("radio")).toHaveLength(MOOD_OPTIONS.length);
  });

  // A shared name is what makes these one group, and what buys the arrow-key
  // navigation and single tab stop.
  it("puts every option in the same radio group", () => {
    render(<MoodSelector name="rating" />);

    const names = new Set(
      screen.getAllByRole("radio").map((radio) => radio.getAttribute("name")),
    );
    expect(names).toEqual(new Set(["rating"]));
  });

  it("selects one rating at a time", async () => {
    const user = userEvent.setup();
    render(<MoodSelector name="rating" />);

    const good = screen.getByRole("radio", { name: "Good" });
    const veryLow = screen.getByRole("radio", { name: "Very low" });

    await user.click(good);
    expect(good).toBeChecked();

    await user.click(veryLow);
    expect(veryLow).toBeChecked();
    expect(good).not.toBeChecked();
  });

  it("starts with nothing selected so no mood is the default", () => {
    render(<MoodSelector name="rating" />);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("points the group at its error message when there is one", () => {
    render(
      <MoodSelector name="rating" errorId="rating-error" hasError={true} />,
    );

    const group = screen.getByRole("group", { name: /how are you feeling/i });
    expect(group).toHaveAttribute("aria-describedby", "rating-error");
    expect(group).toHaveAttribute("aria-invalid", "true");
  });

  it("leaves the error wiring off when there is no error", () => {
    render(<MoodSelector name="rating" errorId="rating-error" />);

    const group = screen.getByRole("group", { name: /how are you feeling/i });
    expect(group).not.toHaveAttribute("aria-describedby");
    expect(group).not.toHaveAttribute("aria-invalid");
  });
});
