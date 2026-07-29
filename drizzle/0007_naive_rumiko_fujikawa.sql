CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"time_zone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
