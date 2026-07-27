/**
 * Verifies the create_entry RPC against the real database.
 *
 * Simulates two authenticated users by setting the role and the JWT claim that
 * auth.uid() reads, as PostgREST does per request. Everything runs inside
 * transactions that are rolled back.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const ALICE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BOB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let failures = 0;

function check(label: string, passed: boolean, detail?: unknown) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) {
    failures += 1;
    if (detail !== undefined) console.log("      ", detail);
  }
}

async function main() {
  // 1. Column type actually changed.
  const [column] = await sql`
    SELECT data_type, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'sleep_hours'
  `;
  check(
    "sleep_hours is numeric(3,1)",
    column.data_type === "numeric" &&
      column.numeric_precision === 3 &&
      column.numeric_scale === 1,
    column,
  );

  // 2. Function exists with the security properties the whole design rests on.
  const [fn] = await sql`
    SELECT prosecdef, proconfig, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc
    WHERE proname = 'create_entry'
      AND pronamespace = 'public'::regnamespace
  `;
  check("create_entry exists", Boolean(fn), fn);
  check(
    "create_entry is SECURITY INVOKER (so RLS still applies)",
    fn?.prosecdef === false,
    fn?.prosecdef,
  );
  check(
    "create_entry pins an empty search_path",
    Array.isArray(fn?.proconfig) && fn.proconfig.includes('search_path=""'),
    fn?.proconfig,
  );

  // 3. Grants: authenticated can execute, anon cannot.
  const [grants] = await sql`
    SELECT
      has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can,
      has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can
    FROM pg_proc p
    WHERE p.proname = 'create_entry'
      AND p.pronamespace = 'public'::regnamespace
  `;
  check("authenticated may execute create_entry", grants.auth_can === true);
  check("anon may NOT execute create_entry", grants.anon_can === false);

  // 4. Happy path, as Alice, rolled back.
  await sql
    .begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: ALICE, role: "authenticated" })}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      const [{ create_entry: entryId }] = await tx`
        SELECT create_entry(
          5::smallint, 'a good day', 7.5, true,
          ARRAY[]::uuid[], ARRAY['Verify Tag', 'verify tag', 'work']::text[]
        )
      `;
      check("create_entry returns an id", typeof entryId === "string", entryId);

      const [entry] = await tx`
        SELECT rating, note, sleep_hours, exercised, user_id
        FROM entries WHERE id = ${entryId}
      `;
      check(
        "entry stored half-hour sleep",
        Number(entry.sleep_hours) === 7.5,
        entry.sleep_hours,
      );
      check("entry is owned by the caller", entry.user_id === ALICE);

      const links = await tx`
        SELECT t.name, t.user_id
        FROM entry_tags et JOIN tags t ON t.id = et.tag_id
        WHERE et.entry_id = ${entryId}
        ORDER BY t.name
      `;
      check(
        "case-variant duplicates collapse to one tag",
        links.filter((l) => l.name === "verify tag").length === 1,
        links,
      );
      check(
        "an existing system tag is reused, not cloned",
        links.some((l) => l.name === "work" && l.user_id === null),
        links,
      );
      check("linked exactly the two distinct tags", links.length === 2, links);

      throw new Error("rollback");
    })
    .catch((error) => {
      if (error.message !== "rollback") throw error;
    });

  // 5. Atomicity: a failing entry insert must take the new tags down with it.
  await sql
    .begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: ALICE, role: "authenticated" })}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      let threw = false;
      try {
        // rating 99 violates the CHECK constraint.
        await tx`
          SELECT create_entry(
            99::smallint, NULL, NULL, NULL,
            ARRAY[]::uuid[], ARRAY['orphan-canary']::text[]
          )
        `;
      } catch {
        threw = true;
      }
      check("an invalid rating is rejected", threw);
    })
    .catch(() => {});

  const orphans = await sql`SELECT id FROM tags WHERE name = 'orphan-canary'`;
  check(
    "a failed create_entry leaves no orphan tags behind",
    orphans.length === 0,
    orphans,
  );

  // 6. RLS: Bob cannot link Alice's private tag to his own entry.
  await sql
    .begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: ALICE, role: "authenticated" })}, true)`;
      await tx`SET LOCAL ROLE authenticated`;
      const [aliceTag] = await tx`
        INSERT INTO tags (user_id, name) VALUES (${ALICE}, 'alice-secret')
        RETURNING id
      `;

      await tx`RESET ROLE`;
      await tx`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: BOB, role: "authenticated" })}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      const [{ create_entry: bobEntry }] = await tx`
        SELECT create_entry(
          3::smallint, NULL, NULL, NULL,
          ARRAY[${aliceTag.id}]::uuid[], ARRAY[]::text[]
        )
      `;

      await tx`RESET ROLE`;
      const stolen = await tx`
        SELECT 1 FROM entry_tags
        WHERE entry_id = ${bobEntry} AND tag_id = ${aliceTag.id}
      `;
      check(
        "a forged tag id belonging to another user is silently dropped",
        stolen.length === 0,
        stolen,
      );

      throw new Error("rollback");
    })
    .catch((error) => {
      if (error.message !== "rollback") throw error;
    });

  await sql.end();
  console.log(
    failures === 0 ? "\nAll checks passed." : `\n${failures} FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
