import type { Vaccination } from '../services/vaccinations';

export function getVaccineReminders(
  records: Vaccination[],
): Vaccination[] {
  const latest = new Map<string, Vaccination>();

  for (const record of records) {
    const key = record.vaccineName.trim().toLowerCase();
    const previous = latest.get(key);

    if (
      !previous ||
      record.dateGiven > previous.dateGiven ||
      (record.dateGiven === previous.dateGiven &&
        record.updatedAt > previous.updatedAt)
    ) {
      latest.set(key, record);
    }
  }

  return [...latest.values()]
    .filter((record) => !!record.nextDueDate)
    .sort((a, b) =>
      (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''),
    );
}

export function getVaccineDueStatus(dueDate: string) {
  const now = new Date();

  const today = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const [year, month, day] = dueDate.split('-').map(Number);
  const due = Date.UTC(year, month - 1, day);
  const days = Math.round((due - today) / 86400000);

  if (days < 0) {
    return {
      label: 'Overdue',
      description: `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`,
      color: '#B34436',
    };
  }

  if (days === 0) {
    return {
      label: 'Due today',
      description: 'Due today',
      color: '#A66A16',
    };
  }

  return {
    label: 'Upcoming',
    description: `Due in ${days} day${days === 1 ? '' : 's'}`,
    color: '#3A8D8A',
  };
}