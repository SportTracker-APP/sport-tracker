import { GoalPeriod, GoalType } from '@prisma/client';

function startOfWeek(date: Date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  nextDate.setDate(nextDate.getDate() + diff);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date);

  nextDate.setDate(nextDate.getDate() + 6);
  nextDate.setHours(23, 59, 59, 999);

  return nextDate;
}

export function buildDefaultGoals() {
  const now = new Date();

  return [
    {
      title: '30 km cette semaine',
      type: GoalType.DISTANCE_KM,
      target: 30,
      period: GoalPeriod.WEEKLY,
      startDate: startOfWeek(now),
      endDate: endOfWeek(now),
      isActive: true,
    },
    {
      title: '3 sorties cette semaine',
      type: GoalType.ACTIVITY_COUNT,
      target: 3,
      period: GoalPeriod.WEEKLY,
      startDate: startOfWeek(now),
      endDate: endOfWeek(now),
      isActive: true,
    },
  ];
}
