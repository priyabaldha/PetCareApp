import { useCallback, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { listPets } from '../services/pets';
import { listVaccinations } from '../services/vaccinations';
import { listAppointments } from '../services/appointments';
import { listMedications } from '../services/medications';

import { getVaccineReminders } from '../utils/vaccinationSummary';

export type ReminderKind = 'vaccine' | 'appointment' | 'medication';

export type ReminderGroup =
  | 'overdue'
  | 'today'
  | 'upcoming'
  | 'medications';

export interface CareReminder {
  id: string;
  kind: ReminderKind;
  group: ReminderGroup;
  petId: string;
  petName: string;
  title: string;
  message: string;
  detail: string;
  sortKey: string;
}

interface PetCareData {
  petId: string;
  petName: string;
  vaccines: Awaited<ReturnType<typeof listVaccinations>>;
  appointments: Awaited<ReturnType<typeof listAppointments>>;
  medications: Awaited<ReturnType<typeof listMedications>>;
}

function localDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function localDateTime(date: Date) {
  return (
    `${localDate(date)}T` +
    `${String(date.getHours()).padStart(2, '0')}:` +
    String(date.getMinutes()).padStart(2, '0')
  );
}

function buildReminders(
  pets: PetCareData[],
  now: Date,
): CareReminder[] {
  const today = localDate(now);
  const currentTime = localDateTime(now);
  const result: CareReminder[] = [];

  for (const pet of pets) {
    // Keep the latest record for each vaccine using your existing utility.
    for (const vaccine of getVaccineReminders(pet.vaccines)) {
      if (!vaccine.nextDueDate) continue;

      const dueDate = vaccine.nextDueDate;

      const group: ReminderGroup =
        dueDate < today
          ? 'overdue'
          : dueDate === today
            ? 'today'
            : 'upcoming';

      result.push({
        id: `vaccine:${pet.petId}:${vaccine.id}`,
        kind: 'vaccine',
        group,
        petId: pet.petId,
        petName: pet.petName,
        title: vaccine.vaccineName,
        message:
          group === 'overdue'
            ? `${pet.petName} has a saved vaccination due date that has passed.`
            : group === 'today'
              ? `${pet.petName}’s saved vaccination due date is today.`
              : `${pet.petName} has an upcoming vaccination due date.`,
        detail: `Due date: ${dueDate}`,
        sortKey: `${dueDate}T00:00`,
      });
    }

    for (const appointment of pet.appointments) {
      const appointmentTime = `${appointment.date}T${appointment.time}`;

      if (
        appointment.status !== 'scheduled' ||
        appointmentTime < currentTime
      ) {
        continue;
      }

      result.push({
        id: `appointment:${pet.petId}:${appointment.id}`,
        kind: 'appointment',
        group: appointment.date === today ? 'today' : 'upcoming',
        petId: pet.petId,
        petName: pet.petName,
        title: appointment.clinicName,
        message: `${pet.petName} · ${appointment.reason}`,
        detail:
          `${appointment.date} at ${appointment.time}` +
          (appointment.vetName ? ` · ${appointment.vetName}` : ''),
        sortKey: appointmentTime,
      });
    }

    for (const medication of pet.medications) {
      if (medication.status !== 'active') continue;

      let dateDescription =
        `Start: ${medication.startDate}` +
        (medication.endDate
          ? ` · End: ${medication.endDate}`
          : ' · No end date saved');

      if (medication.startDate > today) {
        dateDescription += '\nFuture start date · Marked Active';
      } else if (medication.endDate && medication.endDate < today) {
        dateDescription +=
          '\nSaved end date has passed · Status is still Active';
      }

      result.push({
        id: `medication:${pet.petId}:${medication.id}`,
        kind: 'medication',
        group: 'medications',
        petId: pet.petId,
        petName: pet.petName,
        title: medication.medicineName,
        message:
          `${pet.petName} · ${medication.dosage}\n` +
          `Frequency: ${medication.frequency}`,
        detail: dateDescription,
        sortKey: `${medication.startDate}T00:00`,
      });
    }
  }

  return result.sort(
    (a, b) =>
      a.sortKey.localeCompare(b.sortKey) ||
      a.petName.localeCompare(b.petName) ||
      a.id.localeCompare(b.id),
  );
}

export function useCareReminders() {
  const [data, setData] = useState<PetCareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const refresh = useCallback(() => {
    setRetry((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setError('');
      setWarnings([]);
      setData([]);
      setNow(new Date());

      async function load() {
        try {
          const pets = await listPets();

          if (!active) return;

          const loaded: PetCareData[] = [];
          const failures: string[] = [];

          // Load one pet at a time to avoid a large burst of requests.
          // Its three independent categories load together.
          for (const pet of pets) {
            if (!active) return;

            const [vaccines, appointments, medications] =
              await Promise.allSettled([
                listVaccinations(pet.id),
                listAppointments(pet.id),
                listMedications(pet.id),
              ]);

            if (!active) return;

            if (vaccines.status === 'rejected') {
              failures.push(`${pet.name}: vaccinations`);
            }

            if (appointments.status === 'rejected') {
              failures.push(`${pet.name}: appointments`);
            }

            if (medications.status === 'rejected') {
              failures.push(`${pet.name}: medications`);
            }

            loaded.push({
              petId: pet.id,
              petName: pet.name,
              vaccines:
                vaccines.status === 'fulfilled' ? vaccines.value : [],
              appointments:
                appointments.status === 'fulfilled'
                  ? appointments.value
                  : [],
              medications:
                medications.status === 'fulfilled'
                  ? medications.value
                  : [],
            });
          }

          if (active) {
            setData(loaded);
            setWarnings(failures);
            setNow(new Date());
          }
        } catch (failure: unknown) {
          if (active) {
            setError(
              failure instanceof Error
                ? failure.message
                : 'Could not load reminders.',
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void load();

      // Reclassify dates while the page stays open.
      const timer = setInterval(() => {
        if (active) setNow(new Date());
      }, 30_000);

      const subscription = AppState.addEventListener(
        'change',
        (state) => {
          if (state === 'active' && active) {
            setNow(new Date());
            refresh();
          }
        },
      );

      return () => {
        active = false;
        clearInterval(timer);
        subscription.remove();
      };
    }, [retry, refresh]),
  );

  const reminders = useMemo(
    () => buildReminders(data, now),
    [data, now],
  );

  return {
    reminders,
    loading,
    error,
    warnings,
    refresh,
  };
}