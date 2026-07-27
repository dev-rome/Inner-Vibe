import { db } from "@/db";
import { tags } from "@/db/schema";

const SYSTEM_TAGS = [
  "work",
  "family",
  "friends",
  "health",
  "exercise",
  "sleep",
  "food",
  "money",
  "relationship",
  "hobby",
] as const;

async function seed() {
  console.log("Seeding system tags...");

  await db
    .insert(tags)
    .values(SYSTEM_TAGS.map((name) => ({ name, userId: null })))
    .onConflictDoNothing();

  console.log(`Seeded ${SYSTEM_TAGS.length} system tags.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
