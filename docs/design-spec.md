# InnerVibe Design Spec

The tokens live in `src/app/globals.css`. This document is the reasoning: what
each token is for, what it must never be used for, and which rules are
load-bearing rather than stylistic.

---

## The one rule

> ### Coral appears on exactly three things
>
> 1. The **selected** mood rating
> 2. **Primary buttons**
> 3. **Encouragement moments** (a save confirmed, a streak noticed)
>
> Never on a low mood. Never as a status colour. Never on a secondary control,
> a hover state for something unimportant, or a decorative flourish.

**Mood ratings are neutral. The emoji faces carry the warmth, not the colour.**

The reason is not aesthetic. A tracker that paints low days in one colour and
good days in another is passing visual judgement on a feeling, and a wall of
"bad" colour on a hard week reinforces the low rather than holding it
neutrally. Ratings get a calm, uniform treatment; only the _selected_ one warms
up, so logging any mood reads as a small positive act.

Scarcity is the mechanism. Coral reads as warmth because it is rare. Put it on
selected tags, secondary buttons and info badges and it stops meaning anything:
it becomes the colour of the UI, and the selected mood no longer stands out
from its own background.

### What this rules out, concretely

Tag chips and the exercised Yes/No toggles are **not** on the list. They use a
neutral selected treatment: `surface-sunken` fill, `line-strong` border, medium
weight and a check glyph. Selection is never signalled by colour alone, which
also satisfies WCAG 1.4.1.

In the current dashboard, coral appears on the selected mood tile, the Save
button, and the "Entry saved" message. Three places. That is the target.

---

## How to use the tokens

Two layers, and the boundary is enforced by the build rather than by trust.

| Layer                                                     | Where    | Generates utilities? |
| --------------------------------------------------------- | -------- | -------------------- |
| **Raw palette** — `--sage-200`, `--coral-500`             | `:root`  | **No**               |
| **Semantic tokens** — `--color-surface`, `--color-accent` | `@theme` | Yes                  |

There is no `bg-sage-200` utility and there is not meant to be. If a component
needs a colour no semantic token provides, that is a signal the semantic layer
is missing a concept. Add the token; do not reach through.

⚠️ **Tailwind emits nothing for an unknown class.** A typo or a renamed token
produces no error and no warning, just an unstyled element that typechecks and
passes tests. When a border vanishes, suspect a dead token name first.

---

## Colour

### Semantic tokens

| Token                    | Utility                 | Value     | Job                                       |
| ------------------------ | ----------------------- | --------- | ----------------------------------------- |
| `--color-surface`        | `bg-surface`            | sage-50   | Page background                           |
| `--color-surface-raised` | `bg-surface-raised`     | white     | Cards, inputs                             |
| `--color-surface-sunken` | `bg-surface-sunken`     | sage-100  | Wells, unselected tiles, neutral selected |
| `--color-line`           | `border-line`           | sage-200  | Dividers, card edges                      |
| `--color-line-strong`    | `border-line-strong`    | sage-300  | Emphasis, neutral selected                |
| `--color-field`          | `border-field`          | sage-500  | **Form control boundaries only**          |
| `--color-ink`            | `text-ink`              | sage-900  | Primary text                              |
| `--color-muted`          | `text-muted`            | sage-700  | Secondary text, labels                    |
| `--color-subtle`         | `text-subtle`           | sage-600  | Captions, timestamps, tags                |
| `--color-icon`           | `text-icon`             | sage-500  | Icons and marks, **never text**           |
| `--color-accent`         | `bg-accent`             | coral-500 | Accent fills                              |
| `--color-accent-hover`   | `bg-accent-hover`       | coral-400 | Accent hover                              |
| `--color-accent-pressed` | `border-accent-pressed` | coral-600 | Accent pressed border                     |
| `--color-accent-ink`     | `text-accent-ink`       | sage-900  | Text **on** an accent fill                |
| `--color-accent-strong`  | `text-accent-strong`    | coral-700 | Coral text **on** a light surface         |
| `--color-focus`          | `outline-focus`         | coral-600 | Focus ring                                |
| `--color-status-ok`      | `text-status-ok`        | #5B8A6B   | Icons/borders, **never text**             |
| `--color-status-warn`    | `text-status-warn`      | #C6893F   | Icons/borders, **never text**             |
| `--color-status-error`   | `text-status-error`     | #8C3A2E   | Validation messages                       |

### Measured contrast

Computed from WCAG relative luminance.

| Pair                       | Ratio  | Required |     |
| -------------------------- | ------ | -------- | --- |
| ink on surface             | 13.3:1 | 4.5      | ✅  |
| muted on surface           | 7.9:1  | 4.5      | ✅  |
| status-error on surface    | 7.1:1  | 4.5      | ✅  |
| accent-ink on accent-hover | 6.7:1  | 4.5      | ✅  |
| accent-ink on accent       | 5.5:1  | 4.5      | ✅  |
| accent-strong on surface   | 4.9:1  | 4.5      | ✅  |
| subtle on surface          | 4.7:1  | 4.5      | ✅  |
| field border on raised     | 3.8:1  | 3.0      | ✅  |
| icon on raised             | 3.8:1  | 3.0      | ✅  |
| focus ring on surface      | 3.0:1  | 3.0      | ✅  |

### Values that cannot carry text

Real measurements against the page background. Each fails AA at every size, so
they are reserved for icons, dots and borders.

| Value               | As text |     |
| ------------------- | ------- | --- |
| white on coral-500  | 2.6:1   | ❌  |
| white on coral-600  | 3.3:1   | ❌  |
| white on coral-400  | 2.1:1   | ❌  |
| coral-500 as text   | 2.4:1   | ❌  |
| sage-500 as text    | 3.6:1   | ❌  |
| status ok as text   | 3.7:1   | ❌  |
| status warn as text | 2.8:1   | ❌  |

### Four deviations from the original brief

Each is a measurement, not a preference.

1. **`accent-ink` is sage-900, not white.** White fails on every coral in the
   ramp: 2.6:1 at worst, 3.3:1 at best, against a 4.5:1 requirement. Every
   coral hex from the brief is unchanged; only the text colour on top moved.
   Dark-on-warm also reads calmer than white-on-warm, which suits the product.
2. **`sage-600` and `coral-700` were added.** sage-600 because sage-500 as
   `text-subtle` is 3.6:1 and the 13px caption tier has to be legible.
   coral-700 because encouragement copy is coral text on a light surface,
   which is a different job from text on a coral fill and needs its own value.
3. **`--color-field` exists.** `line` and `line-strong` measure 1.3:1 and
   1.6:1 on white. WCAG 1.4.11 asks 3:1 for a form control's visual boundary,
   so decorative lines and input outlines cannot be the same token.
4. **The focus ring is coral-600, not coral-500.** WCAG 2.2 asks 3:1 for a
   focus indicator; coral-500 measures 2.44:1 against the page and coral-600
   is 3.04:1.

**Pressed accent states change the border, not the fill.** `accent-pressed`
(coral-600) carries ink at 4.39:1, a hair under AA, so it is never a text
background. Buttons keep a transparent border and colour it on `:active`, which
also avoids the layout shift a border-on-press would cause.

---

## Type

Instrument Sans for headings, Inter for body, JetBrains Mono for numerals. All
three via `next/font/google`, self-hosted, `display: "swap"`.

`h1`–`h6` pick up Instrument Sans, 600, 1.3 and `-0.01em` from the base layer.
No component needs to write `font-display`.

| Utility     | Size                                 | Line height | Use                        |
| ----------- | ------------------------------------ | ----------- | -------------------------- |
| `text-xs`   | 0.8125rem (13px)                     | 1.4         | Captions, tags, timestamps |
| `text-sm`   | 0.875rem (14px)                      | 1.4         | Labels                     |
| `text-base` | 1rem (16px)                          | 1.6         | Body                       |
| `text-lg`   | 1.125rem (18px)                      | 1.6         | Lead, entry notes          |
| `text-xl`   | 1.375rem (22px)                      | 1.3         | Card titles                |
| `text-2xl`  | 1.75rem (28px)                       | 1.3         | Page headings              |
| `text-3xl`  | clamp(2rem, 1.4rem + 2.5vw, 2.75rem) | 1.3         | Dashboard greeting         |

`xl` and up carry `-0.01em` automatically. Weights: `font-normal` (400) body,
`font-medium` (500) labels and buttons, `font-semibold` (600) headings. These
are Tailwind's defaults and are not redefined.

### Numerals

Sleep hours and timestamps use `font-mono tabular-nums`. Tabular figures are
the point: without them a clock ticking 11:19 → 11:20 shifts every glyph around
it, and a column of sleep hours fails to line up. **Prose never uses mono** —
in mixed strings, wrap only the number:

```tsx
<span className="font-mono tabular-nums">{entry.sleepHours}</span>h sleep
```

---

## Units

Which unit to reach for is a decision, not a formatting detail. The rule is
whether the value should move when the reader changes their text size.

| Unit     | Use for                                  | Why                                                                                                                                                                                                                                                |
| -------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rem`    | Font sizes, spacing, target sizes        | Relative to the root font size, so it scales when a reader raises their **browser default font size** — the common low-vision setting, which `px` ignores entirely. Browser zoom scales everything, so `px` only looks fine if you test with zoom. |
| `em`     | Icons beside text, letter-spacing        | Relative to the element's own font size, so a mark keeps its proportion to the label it sits next to without a second breakpoint.                                                                                                                  |
| unitless | Line height                              | Multiplies the element's own size. A fixed line height inherited into larger text collides.                                                                                                                                                        |
| `px`     | Borders, outlines, radii, shadow offsets | Physical details. A hairline should stay a hairline, and a corner radius that grows with text size makes large type look inflated.                                                                                                                 |

Tailwind's spacing scale is already rem-based (`--spacing` is `0.25rem`), so
`p-4`, `gap-8` and `size-6` all satisfy this without extra thought. The places
that need a conscious choice are raw values in arbitrary brackets: prefer
`h-[1em]` over `h-[16px]` for anything sitting beside text.

---

## Spacing

4px base. Tailwind v4's `--spacing` default is already `0.25rem`, so the scale
is inherited rather than redefined: `p-4` is 16px, `gap-8` is 32px.

| Context          | Value                          |
| ---------------- | ------------------------------ |
| Card padding     | `p-4` mobile, `sm:p-6` desktop |
| Form field gap   | `gap-4`                        |
| Form section gap | `gap-8`                        |
| Page section gap | `gap-8` to `gap-12`            |

---

## Radius and elevation

| Utility        | Value  | Use                       |
| -------------- | ------ | ------------------------- |
| `rounded-sm`   | 8px    | Inputs, textareas         |
| `rounded-md`   | 12px   | Buttons, mood tiles       |
| `rounded-lg`   | 16px   | Cards                     |
| `rounded-xl`   | 20px   | Modals                    |
| `rounded-full` | 9999px | Tag chips, pills, avatars |

⚠️ **These override Tailwind's defaults.** `rounded-lg` is 16px here, not 8px.
If a radius looks twice what you expected, this is why.

**Prefer borders over shadows.** `shadow-sm` and `shadow-md` are almost
invisible by design (4% and 6% alpha). Definition comes from a `border-line`;
shadow is for genuine layering, like a modal over a page or a dropdown over
content. Two stacked shadows on a flat surface is a bug.

---

## Motion

| Token           | Value                           | Use                  |
| --------------- | ------------------------------- | -------------------- |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)`  | Colour and opacity   |
| `ease-out`      | `cubic-bezier(0.16, 1, 0.3, 1)` | Anything entering    |
| `duration-150`  | 150ms                           | Hover, state changes |
| `duration-200`  | 200ms                           | Default              |
| `duration-300`  | 300ms                           | Panels, sheets       |

**Everything is gated behind `prefers-reduced-motion: reduce`**, handled
globally — no component opts in. Under that query motion is effectively
removed, not merely reduced. This app is used by people having a hard day and
vestibular triggers are not a nice-to-have.

Durations use `0.01ms` rather than `0s` so `transitionend` still fires and any
JavaScript waiting on it does not hang.

---

## Focus

One rule, declared globally on `:focus-visible`: a 2px `--color-focus` outline
at 2px offset. `:focus-visible` rather than `:focus`, so it appears for
keyboard navigation and not for mouse clicks.

It is global because several controls (mood tiles, tag chips, the Yes/No
toggles) hide their real input with `sr-only` and paint a sibling. Those still
need `peer-focus-visible:outline-focus` on the painted element, since the
global rule lands on the clipped input where nobody can see it.

---

## Component patterns

### Mood scale (6-point)

Six points, not five: an odd scale has an exact middle, and the middle is where
people put a feeling they would rather not look at.

| Rating | Face | Label         |
| ------ | ---- | ------------- |
| 1      | 😞   | Very low      |
| 2      | 😔   | Low           |
| 3      | 😕   | Slightly low  |
| 4      | 🙂   | Slightly good |
| 5      | 😊   | Good          |
| 6      | 😄   | Very good     |

- **Unselected** — `bg-surface-sunken`, `border-line`, `rounded-md`. Identical
  for all six. No rating looks worse than another.
- **Selected** — `bg-accent`, `border-accent`. The only mood state with colour.
- **Focus** — `peer-focus-visible:outline-focus`, 2px, 2px offset.

Built on native `<input type="radio">`, visually hidden with `sr-only`
(clipped, not `display: none`, which would make them unfocusable) and painted
via the sibling label. Arrow-key navigation, a single tab stop, "3 of 6"
announcements and no-JS operation all come from the platform. Emoji are
`aria-hidden`; the text label is the accessible name, or a screen reader
announces "pensive face" — the name of a codepoint, not a mood.

### Buttons

|                 | Background          | Text              | Border                  | Radius       |
| --------------- | ------------------- | ----------------- | ----------------------- | ------------ |
| Primary         | `bg-accent`         | `text-accent-ink` | `border-transparent`    | `rounded-md` |
| Primary hover   | `bg-accent-hover`   | `text-accent-ink` | `border-transparent`    |              |
| Primary active  | `bg-accent`         | `text-accent-ink` | `border-accent-pressed` |              |
| Secondary       | `bg-surface-raised` | `text-ink`        | `border-field`          | `rounded-md` |
| Secondary hover | `bg-surface-sunken` | `text-ink`        | `border-field`          |              |

`font-medium`, `transition-colors duration-150 ease-standard`.

**Never hand-roll one.** `components/ui/button.tsx` owns the styles;
`components/ui/submit-button.tsx` adds the loading state. A one-off `<button>`
with pasted classes is how variants drift.

| Component        | Use                                                   |
| ---------------- | ----------------------------------------------------- |
| `<SubmitButton>` | Anything inside a `<form action={...}>`               |
| `<Button>`       | Everything else (a `reset()` handler, a local toggle) |

#### Loading state

`SubmitButton` reads `useFormStatus()`, so it picks up the pending state of its
enclosing form with no prop threading and works whether or not the parent uses
`useActionState`. While pending it shows a spinner and a `pendingLabel`
("Saving…", "Signing in…") in place of the label.

It sets **`aria-disabled`, not `disabled`.** A `disabled` button drops out of
the tab order, so a keyboard or screen reader user who just pressed it loses
focus to the document body and is told nothing about why. `aria-disabled` keeps
it focusable and announced; an `onClick` guard is what actually blocks the
second submit. `aria-busy` marks the in-flight state.

The same reasoning applies to non-loading disabled states, like the tag picker's
Add button with an empty input: `aria-disabled` so it stays discoverable, with
the handler no-opping.

#### Targets

Interactive targets are at least 24×24px (WCAG 2.5.8). Icon-only controls need
this stated explicitly — the tag chip's remove button is `size-6` with a
negative margin so the chip does not grow around it.

### Inputs

`bg-surface-raised`, `border-field`, `rounded-sm`, `text-ink`,
`placeholder:text-subtle`. Never `border-line` — it is under 2:1 and fails
1.4.11 as a control boundary. Numeric inputs add `font-mono tabular-nums`.

### Tag chips

`rounded-full`, `text-xs`.

- **Unselected** — `bg-surface-raised`, `border-line`
- **Selected** — `bg-surface-sunken`, `border-line-strong`, `font-medium`, and
  a `✓` prefix

**No coral.** Tags are not on the allowlist.

### Cards

`bg-surface-raised`, `border-line`, `rounded-lg`, `p-4 sm:p-6`. No shadow
unless the card genuinely floats above something.

---

## Review checklist

- [ ] Is coral on anything other than a selected mood, a primary button, or an encouragement moment?
- [ ] Does any mood rating carry colour that varies by value?
- [ ] Any raw palette value referenced directly instead of a semantic token?
- [ ] Any text set in `text-icon`, `status-ok` or `status-warn`?
- [ ] Any input outlined with `border-line` instead of `border-field`?
- [ ] Any state signalled by colour alone?
- [ ] Any numeric column without `tabular-nums`, or any prose in `font-mono`?
- [ ] Any new motion not covered by the global reduced-motion query?
- [ ] Any hand-rolled `<button>` instead of `Button` / `SubmitButton`?
- [ ] Any submit without a `pendingLabel`?
- [ ] Any `disabled` where `aria-disabled` would keep the control reachable?
- [ ] Any font size or target size in `px` that should be `rem`?
- [ ] Any icon sized in `px` that sits beside text and should be `em`?
- [ ] Any interactive target under 24×24px?
