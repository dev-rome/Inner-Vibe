# Decisions

A running log of the non-obvious technical and product choices in InnerVibe,
and the reasoning behind each. The point is that every choice here was a real
fork with a trade-off, not a default.

## Product

**InnerVibe is a personal mood journal, not a clinical tool.** It never
diagnoses, scores medically, or tells a user what their data "means" about their
mental health. It records how someone feels over time and surfaces patterns in
their own data. This boundary is a design constraint, not a disclaimer, and it
shapes every feature decision below.

**Mood ratings are neutral, never color-coded by value.** A tracker that paints
low days blue and good days warm is passing visual judgment on a feeling, and a
wall of "bad" colors on a hard week can reinforce the low rather than hold it
neutrally. Ratings use a calm, uniform treatment; only the _selected_ rating
gets the warm accent, so logging any mood reads as a small positive action. No
information is lost: the charts and insights still surface every pattern.

**Emoji faces carry the warmth the color deliberately withholds.** Keeping
ratings neutral risks feeling clinical, so each rating shows a friendly face.
The face invites; the color stays calm. The stored value is always the number,
never the emoji, so the visual layer can change without touching the data.

**Six points on the scale, not five.** An odd-numbered scale has an exact
middle, and the middle is where people put a feeling they do not want to look
at. Six forces a lean one way or the other. The cost is that the two central
options ("slightly low", "slightly good") are a finer distinction than some
users will care to make; the benefit is that no entry is a shrug.

**"Did not exercise" and "did not say" are stored as different values.** The
`exercised` column is nullable and the form asks with Yes/No buttons rather
than a single checkbox. A checkbox has only two states, so every skipped
question would be recorded as an explicit "no" and the app would be inventing
data the user never entered. That matters more here than in most apps, because
the whole point is to eventually show people patterns in their own data, and a
pattern built on invented values is worse than no pattern. The known rough edge:
once you answer Yes or No there is no way to go back to unanswered.

## Design

**Calm foundation, single warm accent.** A sage-tinted neutral base keeps the
app feeling safe and grown-up rather than either cold or juvenile. The warm
coral accent is reserved for moments that deserve it: the primary action, the
selected mood, encouragement. Scarcity is what makes the accent read as warmth
rather than noise.

**Two corals, because contrast forced the issue.** The intended accent
(`#E08A6B`) carries white text at 2.62:1, which fails WCAG AA at any size.
Rather than abandon the colour or ship unreadable buttons, it is split by job:
the soft coral stays a _surface_ colour for selected states, rings and
indicators, where it only has to be perceivable, and it pairs with ink text
(5.46:1) when it carries a label. Filled buttons that want white text use a
deeper coral, `#A85436` (5.27:1). Same hue family, so the two still read as one
accent. Secondary text is `#5C6259` rather than the sage `#7C8577`, which at
3.57:1 on the page background is a UI-boundary colour, not a body-text one.

**The mood scale is built on native radio inputs.** Visually hidden with
`sr-only` (clipped, not `display: none`, which would make them unfocusable) and
styled through their sibling label. This is the accessibility decision with the
largest payoff per line: arrow-key navigation, a single tab stop for the group,
"3 of 6" announcements, form participation and no-JavaScript operation all come
free from the platform. The alternative, buttons in a `role="radiogroup"`,
means reimplementing every one of those by hand, and the usual result is a
control that works with a mouse and nowhere else. The emoji is `aria-hidden`
and each option carries a text label, because otherwise a screen reader
announces "pensive face", which is the name of a Unicode codepoint rather than
a mood.

## Data and privacy

**Per-user data isolation is enforced at the database, not in application code.**
A user's entries are private by definition in this domain, so the guarantee that
one user can never read another's data is enforced at the lowest layer
(row-level security) rather than trusted to application logic that a future bug
could bypass. [Expand with the specific approach once auth and the schema land.]

**Writing an entry goes through a Postgres function, to buy atomicity without
giving up RLS.** Creating an entry is up to three writes: any new custom tags,
the entry row, then the `entry_tags` links. The Supabase JS client cannot open
a transaction, so doing this from TypeScript means a failure halfway through
leaves an entry that silently lost its tags. The alternative considered was
sequential writes plus a compensating delete, which is simpler and keeps the
logic testable in Vitest, but it is a cleanup routine pretending to be a
transaction and it fails in its own right.

`public.create_entry` is `SECURITY INVOKER`, which is the entire point: the
function body is one transaction, but it runs as the _calling_ role, so
`auth.uid()` still resolves to the logged-in user and every statement inside is
still filtered by RLS. A `SECURITY DEFINER` function would also have been
atomic and would have quietly bypassed every policy in the process. It also
pins `search_path = ''` so nothing on the caller's path can shadow the tables
it references.

The cost is real and worth naming: logic now lives in SQL, where the Vitest
suite cannot reach it. That is covered by `npm run db:verify`, which exercises
the function against the real database as two simulated users and asserts the
properties that only exist at that layer, including that a failed insert leaves
no orphan tags and that a forged tag id belonging to another user is dropped
rather than linked.

**Tag names are stored lowercase.** The unique index on `(user_id, name)` is
case-sensitive, so without normalising, "Work" and "work" are two rows and the
picker shows both. Lowercasing makes the index actually mean what it looks like
it means, and matches the seeded system tags.

**The data layer translates between database rows and domain objects.** The
Supabase client knows nothing about the Drizzle schema, so it returns raw
Postgres columns: `logged_at`, not `loggedAt`, and an ISO string rather than a
`Date`. Typing those rows directly as `InferSelectModel<typeof entries>` looks
tidy and is a lie that TypeScript will not catch, because the client hands back
loosely typed rows that get assigned straight through. Each `get*` function
owns an explicit row type and a mapper. The mapper is also where fields get
dropped: `user_id` never reaches the client, because RLS already guarantees
every row belongs to the caller and shipping it says nothing new.

## Stack

**Next.js 16 (App Router) + TypeScript.** Server Components keep data-fetching on
the server and ship less JavaScript to the client; TypeScript makes the data
model self-documenting and catches shape mismatches at build time.

**PostgreSQL via Supabase, queried through Drizzle ORM.** [Fill in the reasoning
when we reach the database step, so it reflects the actual decision rather than a
placeholder.]

**Server Actions are treated as public endpoints.** Every action re-checks
`getUser()` even though the dashboard layout already guards the route. A Server
Action compiles to a POST endpoint against the page; anyone who can replay that
request reaches the function without ever rendering the form. Render-time
gating is a UX affordance, not a security boundary, and RLS is the layer
underneath that holds even if this check is ever forgotten.

**`refresh()` rather than `revalidatePath()` after a write.** Entry reads go
through the Supabase client, which reads cookies, so they are dynamic and were
never in the Next cache. There is nothing to invalidate. `refresh()` refetches
the route's RSC payload and Next ships it in the same response as the action's
return value, so the list updates in one roundtrip.

## Known limitations

**Dates render in the server's timezone.** `EntryList` formats on the server,
which in production means UTC, so an entry logged at 9pm local can display as
tomorrow. Fixing it properly means deciding what "a day" means for someone who
travels, which is the same question the timeline and streak features have to
answer. It gets solved once, there, rather than patched twice.

**`sleep_hours` is `numeric(3,1)`, migrated from `integer`.** The original
integer column silently rounded 7.5 away, which is the single most common way
people report sleep. Migrated while the table was empty and the change was
free. Values are still rounded to one decimal place by the column type.
