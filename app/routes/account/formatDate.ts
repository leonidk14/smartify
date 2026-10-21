function isSameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
  });
}

export function formatEventTime(iso: string): string {
  const date = new Date(iso);
  if (!isSameDay(date, new Date())) {
    return formatShortDate(iso);
  }
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `today ${time}`;
}
