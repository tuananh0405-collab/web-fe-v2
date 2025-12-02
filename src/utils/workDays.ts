// Shared helper to format work_days values into weekday names.
// Supports input shapes: string ("1 2 3" or "1,2,3"), array, number.
// Assumption: 1 = Monday, 7 = Sunday.
export function formatWorkDays(wd: any): string {
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (wd == null) return "";

  let nums: number[] = [];
  if (Array.isArray(wd)) {
    nums = wd.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  } else if (typeof wd === "number") {
    nums = [wd];
  } else if (typeof wd === "string") {
    nums = wd
      .split(/[,\s]+/)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n));
  } else {
    const n = Number(wd);
    if (!Number.isNaN(n)) nums = [n];
  }

  const names = nums.map((n) => {
    if (n >= 1 && n <= 7) return DAY_NAMES[n - 1];
    return String(n);
  });

  const uniq: string[] = [];
  for (const nm of names) if (!uniq.includes(nm)) uniq.push(nm);

  return uniq.join(", ");
}

export default formatWorkDays;
