CREATE TABLE "pings" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
