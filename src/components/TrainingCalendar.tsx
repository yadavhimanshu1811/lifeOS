"use client";

import React from "react";
import planData from "@/plan.json";

const baseline = planData["15_oct_stats"];
const targets = planData["new_year_expected_stats"];

interface StatRow {
  label: string;
  color: string;
  current: string;
  expected: string;
  range: string;
  unit: string;
}

const STATS: StatRow[] = [
  {
    label: "5K Run",
    color: "#06b6d4",
    current: baseline.run_5km,
    expected: targets.run_5km.expected,
    range: `${targets.run_5km.range[0]} – ${targets.run_5km.range[1]}`,
    unit: "mm:ss",
  },
  {
    label: "Pull-ups",
    color: "#ec4899",
    current: String(baseline.pullups_max_reps),
    expected: String(targets.pullups_max_reps.expected),
    range: `${targets.pullups_max_reps.range[0]} – ${targets.pullups_max_reps.range[1]}`,
    unit: "reps",
  },
  {
    label: "Push-ups",
    color: "#ec4899",
    current: String(baseline.pushups_max_reps),
    expected: String(targets.pushups_max_reps.expected),
    range: `${targets.pushups_max_reps.range[0]} – ${targets.pushups_max_reps.range[1]}`,
    unit: "reps",
  },
  {
    label: "BW Squats",
    color: "#a855f7",
    current: String(baseline.bodyweight_squats_max_reps),
    expected: String(targets.bodyweight_squats_max_reps.expected),
    range: `${targets.bodyweight_squats_max_reps.range[0]} – ${targets.bodyweight_squats_max_reps.range[1]}`,
    unit: "reps",
  },
  {
    label: "Squat 1RM",
    color: "#f59e0b",
    current: String(baseline.barbell_back_squat_1rm_kg),
    expected: String(targets.barbell_back_squat_1rm_kg.expected),
    range: `${targets.barbell_back_squat_1rm_kg.range[0]} – ${targets.barbell_back_squat_1rm_kg.range[1]}`,
    unit: "kg",
  },
  {
    label: "Bench 1RM",
    color: "#f59e0b",
    current: String(baseline.bench_press_1rm_kg),
    expected: String(targets.bench_press_1rm_kg.expected),
    range: `${targets.bench_press_1rm_kg.range[0]} – ${targets.bench_press_1rm_kg.range[1]}`,
    unit: "kg",
  },
  {
    label: "Deadlift 1RM",
    color: "#f59e0b",
    current: String(baseline.deadlift_1rm_kg),
    expected: String(targets.deadlift_1rm_kg.expected),
    range: `${targets.deadlift_1rm_kg.range[0]} – ${targets.deadlift_1rm_kg.range[1]}`,
    unit: "kg",
  },
];


export default function TrainingCalendar(_props?: { [key: string]: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Stats Comparison — transposed: exercises = columns, rows = Now / Target / Delta */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.45rem" }}>
          {/* Exercise column headers */}
          <thead>
            <tr>
              <th
                style={{
                  padding: "0 0.75rem 0.35rem 0",
                  textAlign: "left",
                  fontSize: "0.62rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  width: "80px",
                }}
              />
              {STATS.map((stat) => (
                <th
                  key={stat.label}
                  style={{
                    padding: "0 0.4rem 0.5rem",
                    textAlign: "center",
                    fontSize: "0.68rem",
                    fontWeight: "700",
                    color: stat.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {stat.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Row 1 — Oct 15 (Now) */}
            <tr>
              <td
                style={{
                  padding: "0.55rem 0.75rem 0.55rem 0",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  background: "var(--surface-color)",
                  borderRadius: "10px 0 0 10px",
                  border: "1px solid var(--surface-border)",
                  borderRight: "none",
                  paddingLeft: "0.85rem",
                }}
              >
                Oct 15
              </td>
              {STATS.map((stat) => (
                <td
                  key={stat.label}
                  style={{
                    padding: "0.55rem 0.6rem",
                    textAlign: "center",
                    background: "var(--surface-color)",
                    border: "1px solid var(--surface-border)",
                    borderLeft: "none",
                    borderRight: "none",
                  }}
                >
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)" }}>
                    {stat.current}
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginLeft: "0.2rem" }}>
                    {stat.unit}
                  </span>
                </td>
              ))}
              <td
                style={{
                  background: "var(--surface-color)",
                  border: "1px solid var(--surface-border)",
                  borderLeft: "none",
                  borderRadius: "0 10px 10px 0",
                  width: "8px",
                }}
              />
            </tr>

            {/* Row 2 — Jan 1 Target */}
            <tr>
              <td
                style={{
                  padding: "0.55rem 0.75rem 0.55rem 0",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  background: "rgba(139, 92, 246, 0.06)",
                  borderRadius: "10px 0 0 10px",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  borderRight: "none",
                  paddingLeft: "0.85rem",
                }}
              >
                Jan 1
              </td>
              {STATS.map((stat) => (
                <td
                  key={stat.label}
                  style={{
                    padding: "0.55rem 0.6rem",
                    textAlign: "center",
                    background: "rgba(139, 92, 246, 0.06)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderLeft: "none",
                    borderRight: "none",
                  }}
                >
                  <span style={{ fontSize: "0.95rem", fontWeight: "800", color: stat.color }}>
                    {stat.expected}
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginLeft: "0.2rem" }}>
                    {stat.unit}
                  </span>
                  <div style={{ fontSize: "0.58rem", color: "var(--text-secondary)", opacity: 0.65, marginTop: "1px" }}>
                    {stat.range}
                  </div>
                </td>
              ))}
              <td
                style={{
                  background: "rgba(139, 92, 246, 0.06)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  borderLeft: "none",
                  borderRadius: "0 10px 10px 0",
                  width: "8px",
                }}
              />
            </tr>


          </tbody>
        </table>
      </div>
    </div>
  );
}
