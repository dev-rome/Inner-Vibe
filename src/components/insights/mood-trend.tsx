"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/data/insights";
import { MAX_RATING, MIN_RATING } from "@/lib/validation/entry";
import { moodForRating } from "@/lib/moods";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Range } from "@/lib/insights-range";

type MoodTrendProps = {
  points: TrendPoint[];
  range: Range;
};

type ChartPoint = TrendPoint & { label: string };

/**
 * The bucket is already a calendar date resolved in the reader's zone by
 * Postgres, so it is parsed and formatted as UTC. Formatting it in the local
 * zone again would shift a date that has already been decided.
 */
function formatLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function MoodTrend({ points, range }: MoodTrendProps) {
  const reduced = useReducedMotion();

  if (points.length === 0) {
    return (
      <p className="text-subtle py-12 text-center text-sm">
        No entries in this range yet.
      </p>
    );
  }

  const data: ChartPoint[] = points.map((point) => ({
    ...point,
    label: formatLabel(point.date),
  }));

  const weekly = range === "year";

  return (
    <div className="h-64 w-full">
      {/*
       * A chart is invisible to a screen reader: the SVG carries no meaning
       * and Recharts adds none. This is the same data as a list, so the
       * information is available rather than merely decorative.
       */}
      <table className="sr-only">
        <caption>
          Average mood {weekly ? "per week" : "per day"} over the selected range
        </caption>
        <thead>
          <tr>
            <th scope="col">{weekly ? "Week starting" : "Date"}</th>
            <th scope="col">Average mood</th>
            <th scope="col">Entries</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <th scope="row">{point.label}</th>
              <td>
                {point.average.toFixed(1)} out of {MAX_RATING}
                {moodForRating(Math.round(point.average))
                  ? `, ${moodForRating(Math.round(point.average))!.label}`
                  : ""}
              </td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          // No negative left margin: the Y axis renders emoji rather than
          // numbers, and pulling it inward clips them.
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            {/* Sage fading to nothing: the area gives the line weight without
                becoming a block of colour competing with the emoji. */}
            <linearGradient id="moodTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-chart)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          {/* Horizontal only, dotted, no vertical rules: enough to read a
              value against, not a grid the eye has to fight through. */}
          <CartesianGrid
            vertical={false}
            stroke="var(--color-line)"
            strokeDasharray="2 6"
          />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-subtle)", fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            domain={[MIN_RATING, MAX_RATING]}
            ticks={[1, 2, 3, 4, 5, 6]}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fill: "var(--color-subtle)", fontSize: 14 }}
            tickFormatter={(value: number) => moodForRating(value)?.emoji ?? ""}
          />

          <Tooltip
            content={<TrendTooltip weekly={weekly} />}
            cursor={{
              stroke: "var(--color-line-strong)",
              strokeDasharray: "2 4",
            }}
          />

          <Area
            type="monotone"
            dataKey="average"
            stroke="var(--color-chart)"
            strokeWidth={2}
            fill="url(#moodTrendFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-accent)", stroke: "none" }}
            // Recharts animates in JavaScript, so the CSS reduced-motion rule
            // cannot reach it. Without this the line still draws itself.
            isAnimationActive={!reduced}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  /** A bare date is ambiguous when each point covers a whole week. */
  weekly?: boolean;
};

/** A small card rather than Recharts' default box, so it belongs to the app. */
function TrendTooltip({ active, payload, weekly }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const mood = moodForRating(Math.round(point.average));

  return (
    <div className="border-line bg-surface-raised rounded-md border px-3 py-2 shadow-md">
      <p className="text-subtle font-mono text-xs tabular-nums">
        {weekly ? `Week of ${point.label}` : point.label}
      </p>
      <p className="text-ink mt-1 flex items-center gap-1.5 text-sm">
        <span aria-hidden="true">{mood?.emoji}</span>
        <span className="font-mono tabular-nums">
          {point.average.toFixed(1)}
        </span>
        <span className="text-subtle">
          {point.count === 1 ? "1 entry" : `${point.count} entries`}
        </span>
      </p>
      {/* Only present when the bucket is a single entry, so the note always
          belongs to the point being hovered. */}
      {point.note && (
        <p className="text-muted mt-1.5 line-clamp-3 max-w-52 text-sm">
          {point.note}
        </p>
      )}
    </div>
  );
}
