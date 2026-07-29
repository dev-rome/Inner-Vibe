/**
 * Verifies the update_entry RPC against the real database.
 *
 * Same harness as verify-create-entry: two simulated users via the JWT claim
 * auth.uid() reads, everything inside transactions that are rolled back.
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

function claims(sub: string) {
  return JSON.stringify({ sub, role: "authenticated" });
}

async function main() {
  const [fn] = await sql`
    SELECT prosecdef, proconfig
    FROM pg_proc
    WHERE proname = 'update_entry'
      AND pronamespace = 'public'::regnamespace
  `;

  check("update_entry exists", Boolean(fn), fn);
  check(
    "update_entry is SECURITY INVOKER (so RLS still applies)",
    fn?.prosecdef === false,
    fn?.prosecdef,
  );
  check(
    "update_entry pins an empty search_path",
    Array.isArray(fn?.proconfig) && fn.proconfig.includes('search_path=""'),
    fn?.proconfig,
  );

  const [grants] = await sql`
    SELECT
      has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can,
      has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can
    FROM pg_proc p
    WHERE p.proname = 'update_entry'
      AND p.pronamespace = 'public'::regnamespace
  `;
  check("authenticated may execute update_entry", grants.auth_can === true);
  check("anon may NOT execute update_entry", grants.anon_can === false);

  await sql
    .begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claims', ${claims(ALICE)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      const [{ create_entry: entryId }] = await tx`
        SELECT create_entry(
          4::smallint, 'before', 6.0, false,
          ARRAY[]::uuid[], ARRAY['alpha', 'beta']::text[]
        )
      `;

      await tx`
        SELECT update_entry(
          ${entryId}::uuid, 6::smallint, 'after', 8.5, true,
          ARRAY[]::uuid[], ARRAY['gamma']::text[]
        )
      `;

      const [row] = await tx`
        SELECT rating, note, sleep_hours, exercised
        FROM entries WHERE id = ${entryId}
      `;
      check(
        "update_entry rewrote the entry",
        row.rating === 6 &&
          row.note === "after" &&
          Number(row.sleep_hours) === 8.5 &&
          row.exercised === true,
        row,
      );

      const links = await tx`
        SELECT t.name FROM entry_tags et JOIN tags t ON t.id = et.tag_id
        WHERE et.entry_id = ${entryId} ORDER BY t.name
      `;
      check(
        "update_entry replaced the tag set rather than adding to it",
        links.length === 1 && links[0].name === "gamma",
        links,
      );

      // Bob's entry is invisible to Alice's UPDATE because of RLS, so the
      // statement matches nothing and the function raises rather than
      // silently doing nothing.
      await tx`RESET ROLE`;
      await tx`SELECT set_config('request.jwt.claims', ${claims(BOB)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      let refused = false;
      try {
        await tx`
          SELECT update_entry(
            ${entryId}::uuid, 1::smallint, 'hijacked', NULL, NULL,
            ARRAY[]::uuid[], ARRAY[]::text[]
          )
        `;
      } catch {
        refused = true;
      }
      check("update_entry refuses another user's entry", refused);

      throw new Error("rollback");
    })
    .catch((error) => {
      if (error.message !== "rollback") throw error;
    });

  // A failed update must not leave the entry stripped of its tags: the DELETE
  // and the re-INSERT are one transaction or the edit loses data.
  await sql
    .begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claims', ${claims(ALICE)}, true)`;
      await tx`SET LOCAL ROLE authenticated`;

      const [{ create_entry: entryId }] = await tx`
        SELECT create_entry(
          3::smallint, NULL, NULL, NULL,
          ARRAY[]::uuid[], ARRAY['keepme']::text[]
        )
      `;

      let threw = false;
      try {
        // rating 99 violates the CHECK, after the tag DELETE would have run.
        await tx`
          SELECT update_entry(
            ${entryId}::uuid, 99::smallint, NULL, NULL, NULL,
            ARRAY[]::uuid[], ARRAY[]::text[]
          )
        `;
      } catch {
        threw = true;
      }
      check("an invalid rating is rejected on update", threw);

      throw new Error("rollback");
    })
    .catch((error) => {
      if (error.message !== "rollback") throw error;
    });

  const leftovers = await sql`
    SELECT id FROM tags WHERE name IN ('alpha', 'beta', 'gamma', 'keepme')
  `;
  check(
    "the rolled-back edits left no tags behind",
    leftovers.length === 0,
    leftovers,
  );

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
