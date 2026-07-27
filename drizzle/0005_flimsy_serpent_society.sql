-- integer -> numeric(3,1) so half hours ("7.5") survive the round trip.
-- The sleep_hours_range CHECK (0-24) is revalidated against the new type by
-- Postgres as part of ALTER COLUMN TYPE, so it carries over unchanged.
ALTER TABLE "entries" ALTER COLUMN "sleep_hours" SET DATA TYPE numeric(3, 1);