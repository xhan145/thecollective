/**
 * Time-of-day greeting, based on the local hour.
 *
 * Buckets (local time):
 *   05:00–11:59 → "Good morning"
 *   12:00–16:59 → "Good afternoon"
 *   17:00–04:59 → "Good evening"  (covers night)
 *
 * Pure + deterministic: pass a Date for testing; defaults to now.
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 11) return "Good morning";
  if (hour >= 12 && hour <= 16) return "Good afternoon";
  return "Good evening";
}
