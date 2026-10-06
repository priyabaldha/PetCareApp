import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';

import { listPets } from '../services/pets';
import { listAppointments } from '../services/appointments';
import type { Appointment } from '../services/appointments';

type PetAppointment = Appointment & {
  petName: string;
};

function localDateTimeKey() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}

export function useAppointmentSummary() {
  const [records, setRecords] = useState<PetAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [nowKey, setNowKey] = useState(localDateTimeKey);

  const refresh = useCallback(() => {
    setRetry((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setError('');
      setRecords([]);
      setNowKey(localDateTimeKey());

      async function load() {
        try {
          const pets = await listPets();

          if (!active) return;

          const groups = await Promise.all(
            pets.map(async (pet) => {
              const appointments = await listAppointments(pet.id);

              return appointments.map((appointment) => ({
                ...appointment,
                petName: pet.name,
              }));
            }),
          );

          if (active) {
            setRecords(groups.flat());
          }
        } catch (failure: unknown) {
          if (active) {
            setError(
              failure instanceof Error
                ? failure.message
                : 'Could not load appointments.',
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void load();

      const timer = setInterval(() => {
        setNowKey(localDateTimeKey());
      }, 30000);

      const subscription = AppState.addEventListener(
        'change',
        (state) => {
          if (state === 'active') {
            setNowKey(localDateTimeKey());
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

  const upcoming = records
    .filter(
      (appointment) =>
        appointment.status === 'scheduled' &&
        `${appointment.date}T${appointment.time}` >= nowKey,
    )
    .sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    );

  return {
    loading,
    error,
    refresh,
    upcoming,
    next: upcoming[0],
    count: upcoming.length,
  };
}