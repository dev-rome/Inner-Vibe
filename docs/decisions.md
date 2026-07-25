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
neutrally. Ratings use a calm, uniform treatment; only the *selected* rating
gets the warm accent, so logging any mood reads as a small positive action. No
information is lost: the charts and insights still surface every pattern.

**Emoji faces carry the warmth the color deliberately withholds.** Keeping
ratings neutral risks feeling clinical, so each rating shows a friendly face.
The face invites; the color stays calm. The stored value is always the number,
never the emoji, so the visual layer can change without touching the data.

## Design

**Calm foundation, single warm accent.** A sage-tinted neutral base keeps the
app feeling safe and grown-up rather than either cold or juvenile. The warm
coral accent is reserved for moments that deserve it: the primary action, the
selected mood, encouragement. Scarcity is what makes the accent read as warmth
rather than noise.

## Data and privacy

**Per-user data isolation is enforced at the database, not in application code.**
A user's entries are private by definition in this domain, so the guarantee that
one user can never read another's data is enforced at the lowest layer
(row-level security) rather than trusted to application logic that a future bug
could bypass. [Expand with the specific approach once auth and the schema land.]

## Stack

**Next.js 16 (App Router) + TypeScript.** Server Components keep data-fetching on
the server and ship less JavaScript to the client; TypeScript makes the data
model self-documenting and catches shape mismatches at build time.

**PostgreSQL via Supabase, queried through Drizzle ORM.** [Fill in the reasoning
when we reach the database step, so it reflects the actual decision rather than a
placeholder.]