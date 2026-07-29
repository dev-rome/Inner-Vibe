/**
 * Verifies the insights aggregate functions against the real database.
 *
 * The property that matters most: these aggregate, so a missing RLS scope
 * would not error, it would quietly average other people's moods into the
 * result. Alice and Bob both log here, and every check asserts Alice only
 * ever sees her own.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const ALICE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BOB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FUNCTIONS = [
  "mood_over_time",
  "mood_by_exercise",
  "mood_by_sleep",
  "mood_by_day",
  "insights_summary",
];

let failures = 0;

function check(label: string, passed: boolean, detail?: unknown) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) {
    failures += 1;
    if (detail !== undefined) console.log("      ", detail);
  }
}

function claims(sub: string) {
  return JSON.stringify({ sub, role: "authenticated" });
}

async function main() {
  for (const name of FUNCTIONS) {
    const [fn] = await sql`
      SELECT prosecdef, proconfig
      FROM pg_proc
      WHERE proname = ${name} AND pronamespace = 'public'::regnamespace
    `;
    check(`${name} exists`, Boolean(fn), fn);
    check(`${name} is SECURITY INVOKER (so RLS still applies)`, fn?.prosecdef === false);
    check(
      `${name} pins an empty search_path`,
      Array.isArray(fn?.proconfig) && fn.proconfig.includes('search_path=""'),
      fn?.proconfig,
    );

    const [grants] = await sql`
      SELECT
        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can,
        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can
      FROM pg_proc p
      WHERE p.proname = ${name} AND p.pronamespace = 'public'::regnamespace
    `;
    check(`${name}: authenticated may execute`, grants.auth_can === true);
    check(`${name}: anon may NOT execute`, grants.anon_can === false);
  }

  await sql
    .begin(async (tx) => {
      // Alice: two entries on one day, one on another. Ratings chosen so the
      // averages are exact and a wrong grouping would be obvious.
      await tx`SELECT set_config('request.jwt.claims', ${claims(ALICE)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      await tx`
        INSERT INTO entries (user_id, rating, note, sleep_hours, exercised, logged_at)
        VALUES
          (${ALICE}, 2, 'first',     5.0, false, '2026-07-20T12:00:00Z'),
          (${ALICE}, 4, 'second',    5.5, false, '2026-07-20T18:00:00Z'),
          (${ALICE}, 6, NULL,        9.0, true,  '2026-07-21T12:00:00Z'),
          (${ALICE}, 4, 'solo note', 7.0, NULL,  '2026-07-22T12:00:00Z')
      `;

      // Bob logs the worst possible moods on the same days. If RLS is missing
      // anywhere, Alice's averages drop and the checks below fail.
      await tx`RESET ROLE`;
      await tx`SELECT set_config('request.jwt.claims', ${claims(BOB)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;
      await tx`
        INSERT INTO entries (user_id, rating, sleep_hours, exercised, logged_at)
        VALUES
          (${BOB}, 1, 1.0, true,  '2026-07-20T12:00:00Z'),
          (${BOB}, 1, 1.0, false, '2026-07-21T12:00:00Z')
      `;

      await tx`RESET ROLE`;
      await tx`SELECT set_config('request.jwt.claims', ${claims(ALICE)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      const from = "2026-07-19T00:00:00Z";
      const to = "2026-07-23T00:00:00Z";

      const daily = await tx`
        SELECT * FROM mood_over_time(${from}::timestamptz, ${to}::timestamptz, 'day', 'UTC')
      `;
      check("mood_over_time returns one row per day", daily.length === 3, daily);
      check(
        "mood_over_time averages within the day, not across it",
        Number(daily[0].avg_rating) === 3 && daily[0].entry_count === 2,
        daily[0],
      );
      check(
        "mood_over_time excludes another user's entries",
        daily.every((d) => Number(d.avg_rating) >= 3),
        daily,
      );

      const weekly = await tx`
        SELECT * FROM mood_over_time(${from}::timestamptz, ${to}::timestamptz, 'week', 'UTC')
      `;
      check("mood_over_time collapses to one bucket weekly", weekly.length === 1, weekly);
      check(
        "the weekly average covers all four entries",
        weekly[0].entry_count === 4 && Number(weekly[0].avg_rating) === 4,
        weekly[0],
      );

      /*
       * The tooltip shows a note only when the bucket is one entry. Day one
       * holds two, so its note must be withheld: there is no honest way to
       * pick one of them to stand for the average.
       */
      check(
        "mood_over_time withholds a note when the bucket has several entries",
        daily[0].entry_count === 2 && daily[0].single_note === null,
        daily[0],
      );
      check(
        "mood_over_time returns the note when the bucket has one entry",
        daily[2].entry_count === 1 && daily[2].single_note === "solo note",
        daily[2],
      );

      const exercise = await tx`
        SELECT * FROM mood_by_exercise(${from}::timestamptz, ${to}::timestamptz)
      `;
      check(
        "mood_by_exercise excludes unanswered days",
        exercise.length === 2 &&
          exercise.reduce((n, r) => n + r.entry_count, 0) === 3,
        exercise,
      );
      const exercised = exercise.find((r) => r.exercised === true);
      const notExercised = exercise.find((r) => r.exercised === false);
      check(
        "mood_by_exercise averages each side separately",
        Number(exercised?.avg_rating) === 6 && Number(notExercised?.avg_rating) === 3,
        exercise,
      );

      const sleep = await tx`
        SELECT * FROM mood_by_sleep(${from}::timestamptz, ${to}::timestamptz)
      `;
      check("mood_by_sleep returns bands low to high",
        sleep.map((r) => r.bucket).join(",") === "under_6,six_to_eight,eight_plus",
        sleep,
      );
      check(
        "mood_by_sleep puts 7.0 in the six-to-eight band",
        sleep.find((r) => r.bucket === "six_to_eight")?.entry_count === 1,
        sleep,
      );
      check(
        "mood_by_sleep puts 9.0 in the eight-plus band",
        sleep.find((r) => r.bucket === "eight_plus")?.entry_count === 1,
        sleep,
      );

      const days = await tx`
        SELECT * FROM mood_by_day(${from}::timestamptz, ${to}::timestamptz, 'UTC')
      `;
      check("mood_by_day returns one row per day", days.length === 3, days);
      check(
        "mood_by_day withholds an entry id when the day has several",
        days[0].entry_count === 2 && days[0].single_entry_id === null,
        days[0],
      );
      check(
        "mood_by_day supplies an entry id when the day has one",
        days[1].entry_count === 1 && days[1].single_entry_id !== null,
        days[1],
      );

      /*
       * The timezone decides which day an entry lands on. Read the same rows
       * in Tokyo and the 18:00 UTC entry becomes 03:00 the next morning, so it
       * moves from the 20th to the 21st.
       *
       * The day *count* is unchanged either way, so counting days would pass
       * whether or not the timezone was applied. The distribution is what
       * actually moves.
       */
      const tokyo = await tx`
        SELECT * FROM mood_by_day(${from}::timestamptz, ${to}::timestamptz, 'Asia/Tokyo')
      `;
      // Compared as counts per day rather than formatted dates: the driver
      // hands back Date objects for a date column, and formatting them here
      // would test this script's date handling rather than the function's.
      const counts = (rows: { entry_count: number }[]) =>
        rows.map((r) => r.entry_count).join(",");

      check(
        "mood_by_day buckets by the caller's timezone",
        counts(days as never) === "2,1,1" && counts(tokyo as never) === "1,2,1",
        { utc: counts(days as never), tokyo: counts(tokyo as never) },
      );

      const [summary] = await tx`SELECT * FROM insights_summary('UTC')`;
      check(
        "insights_summary counts only the caller's entries",
        summary.total_entries === 4,
        summary,
      );

      throw new Error("rollback");
    })
    .catch((error) => {
      if (error.message !== "rollback") throw error;
    });

  /*
   * Its own transaction on purpose. A raised exception aborts the whole
   * transaction it happens in, so running this alongside the fixtures above
   * would poison every check that followed it.
   */
  await sql
    .begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claims', ${claims(ALICE)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      let rejected = false;
      try {
        await tx`
          SELECT * FROM mood_over_time(
            now() - interval '1 day', now(), 'century', 'UTC'
          )
        `;
      } catch {
        rejected = true;
      }
      check("mood_over_time rejects an unsupported bucket", rejected);
    })
    .catch(() => {
      // The aborted transaction cannot commit; nothing was written anyway.
    });

  const leftovers = await sql`
    SELECT id FROM entries WHERE user_id IN (${ALICE}, ${BOB})
  `;
  check("the rolled-back fixtures left nothing behind", leftovers.length === 0, leftovers);

  await sql.end();
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
