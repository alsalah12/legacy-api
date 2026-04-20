// Time-aware greeting helper used across dashboard surfaces.
// This keeps greeting logic reusable and testable instead of hardcoded in JSX.
export function getTimeBasedGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour <= 11) return "Good morning";
  if (hour >= 12 && hour <= 17) return "Good afternoon";
  return "Good evening";
}
