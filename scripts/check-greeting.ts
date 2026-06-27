import { getGreeting } from "../lib/greeting";

function at(hour: number): string {
  const d = new Date(2026, 0, 1, hour, 30, 0); // local time, mid-hour
  return getGreeting(d);
}

function expect(hour: number, want: string) {
  const got = at(hour);
  if (got !== want) {
    throw new Error(`greeting at ${hour}:30 — expected "${want}", got "${got}"`);
  }
}

// Morning 5–11
expect(5, "Good morning");
expect(8, "Good morning");
expect(11, "Good morning");
// Afternoon 12–16
expect(12, "Good afternoon");
expect(16, "Good afternoon");
// Evening 17–4 (incl. night)
expect(17, "Good evening");
expect(23, "Good evening");
expect(0, "Good evening");
expect(4, "Good evening");

console.log("greeting checks passed");
