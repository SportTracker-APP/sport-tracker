function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

export function startOfMonth(date: Date) {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), 1);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function getLocalDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getGoalDeadline(goal: unknown) {
  if (!isRecord(goal)) {
    return null;
  }

  const candidateKeys = [
    "deadline",
    "endDate",
    "targetDate",
    "dueDate",
    "expiresAt",
    "periodEnd",
  ] as const;

  for (const key of candidateKeys) {
    const rawValue = goal[key];

    if (typeof rawValue !== "string" && !(rawValue instanceof Date)) {
      continue;
    }

    const date =
      rawValue instanceof Date ? new Date(rawValue) : new Date(rawValue);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

export function formatGoalDeadline(date: Date | null) {
  if (!date) {
    return "Période glissante · 30 jours";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(date);
  deadline.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (deadline.getTime() - today.getTime()) / 86_400_000,
  );
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).format(deadline);

  if (daysRemaining < 0) {
    return `Échéance dépassée · ${formattedDate}`;
  }

  if (daysRemaining === 0) {
    return "Échéance aujourd’hui";
  }

  if (daysRemaining === 1) {
    return `Échéance demain · ${formattedDate}`;
  }

  return `Échéance le ${formattedDate} · ${daysRemaining} jours`;
}

export function formatMonthYear(date: Date) {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMonthName(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
  }).format(date);
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits,
  }).format(value);
}

export function formatDistance(distance: number, maximumFractionDigits = 1) {
  return `${formatNumber(distance, maximumFractionDigits)} km`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${String(remainingMinutes).padStart(2, "0")}`;
}

export function formatDayCount(days: number) {
  return `${formatNumber(days)} ${days === 1 ? "jour" : "jours"}`;
}

export function formatPace(totalMinutes: number, distanceKm: number) {
  if (distanceKm <= 0) {
    return "—";
  }

  const totalSeconds = Math.round((totalMinutes / distanceKm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

export function formatSignedDistance(distance: number) {
  if (distance === 0) {
    return "Stable cette semaine";
  }

  const prefix = distance > 0 ? "+" : "−";
  return `${prefix}${formatDistance(Math.abs(distance), 1)} vs semaine passée`;
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}
