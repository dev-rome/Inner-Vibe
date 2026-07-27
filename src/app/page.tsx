import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

const POINTS = [
  {
    title: "Private by default",
    body: "Your entries are yours. Isolation is enforced by the database itself, not by application code that a future bug could get wrong.",
  },
  {
    title: "Seconds to log",
    body: "Pick how you feel. Add a note, your sleep, whether you moved, a tag or two. Everything past the first tap is optional.",
  },
  {
    title: "Patterns, not verdicts",
    body: "InnerVibe reflects your own data back to you. It is not a clinical tool, it does not diagnose, and it will never tell you what your feelings mean.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-24">
        <p className="text-subtle text-sm font-medium">InnerVibe</p>

        <h1 className="mt-3 max-w-2xl text-3xl">
          Notice how you feel, over time.
        </h1>

        <p className="text-muted mt-4 max-w-xl text-lg">
          A private mood journal. Log a moment in seconds, then look back and
          see what the pattern actually was, rather than what you remember it
          being.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {/* Anchors, not buttons: these navigate. buttonClasses keeps the
              look shared without pretending a link is a control. */}
          <Link href="/signup" className={buttonClasses("primary")}>
            Start journalling
          </Link>
          <Link href="/login" className={buttonClasses("secondary")}>
            Log in
          </Link>
        </div>

        <ul className="mt-16 grid gap-6 sm:mt-24 sm:grid-cols-3">
          {POINTS.map((point) => (
            <li
              key={point.title}
              className="border-line bg-surface-raised rounded-lg border p-4 sm:p-6"
            >
              <h2 className="text-ink text-base font-medium">{point.title}</h2>
              <p className="text-muted mt-2 text-sm">{point.body}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="border-line mt-16 border-t">
        <p className="text-subtle mx-auto w-full max-w-3xl px-6 py-6 text-xs">
          InnerVibe is a personal journal, not a medical service. If you are
          struggling, please talk to someone you trust or a health professional.
        </p>
      </footer>
    </div>
  );
}
