export const CURRENCY = "৳";

export function taka(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString("en-BD")}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function daysUntil(dateISO: string): number {
  const now = new Date();
  const then = new Date(dateISO);
  return Math.ceil((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeDue(dateISO: string): string {
  const d = daysUntil(dateISO);
  if (d < 0) return `${Math.abs(d)} days overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}
