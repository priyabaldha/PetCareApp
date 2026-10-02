import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getPet, getPetCount, listPets } from '../services/pets';

function useFocusedData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setData(null);
    setLoading(true);
    setError('');
    loader().then((result) => { if (active) setData(result); })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : 'Could not load pets.');
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader, retry]));
  const refresh = useCallback(() => setRetry((value) => value + 1), []);
  return { data, loading, error, refresh };
}
export function usePets() { return useFocusedData(listPets); }
export function usePetCount() { return useFocusedData(getPetCount); }
export function usePet(id: string) {
  return useFocusedData(useCallback(() => getPet(id), [id]));
}
