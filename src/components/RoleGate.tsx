import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  ActivityIndicator,
  AppState,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getCurrentUser,
  logout,
} from '../services/auth';
import type { AuthUser } from '../services/auth';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

interface Props {
  children: ReactNode;
  onLoggedOut: () => void;
}

export default function RoleGate({
  children,
  onLoggedOut,
}: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  const mounted = useRef(false);
  const logoutBusy = useRef(false);

  const recheck = useCallback(() => {
    setRetry((value) => value + 1);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck();
    });

    return () => subscription.remove();
  }, [recheck]);

  useEffect(() => {
    let active = true;
    let settled = false;

    setChecking(true);
    setError('');
    setUser(null);

    const timer = setTimeout(() => {
      if (!active || settled) return;

      settled = true;
      setChecking(false);
      setError('Checking account access took too long. Please retry.');
    }, 20_000);

    async function check() {
      try {
        const currentUser = await getCurrentUser();

        if (!active || settled) return;

        settled = true;
        clearTimeout(timer);

        if (!currentUser) {
          onLoggedOut();
          return;
        }

        setUser(currentUser);
        setChecking(false);
      } catch (failure: unknown) {
        if (!active || settled) return;

        settled = true;
        clearTimeout(timer);
        setChecking(false);
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not check account access.',
        );
      }
    }

    void check();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [retry, onLoggedOut]);

  async function signOut() {
    if (logoutBusy.current) return;

    logoutBusy.current = true;
    setLoggingOut(true);

    try {
      await logout();
      if (mounted.current) onLoggedOut();
    } catch (failure: unknown) {
      if (mounted.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not sign out.',
        );
      }
    } finally {
      logoutBusy.current = false;
      if (mounted.current) setLoggingOut(false);
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator size="large" color="#71579C" />
        <Text style={styles.message}>Checking account access…</Text>
      </SafeAreaView>
    );
  }

  if (error || !user) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>Could not open your account</Text>
        <Text style={styles.message}>
          {error || 'Please retry.'}
        </Text>
        <Button title="Retry" onPress={recheck} />
        <Button
          title={loggingOut ? 'Signing out…' : 'Sign out'}
          disabled={loggingOut}
          onPress={() => {
            void signOut();
          }}
        />
      </SafeAreaView>
    );
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboardScreen
        key={user.id}
        user={user}
        onLoggedOut={onLoggedOut}
        onRecheckRole={recheck}
      />
    );
  }

  if (user.role === 'vet') {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>Hello, {user.name}</Text>
        <Text style={styles.message}>
          Your account has the Vet role. The Vet dashboard is
          coming next.
        </Text>
        <View style={styles.buttonSpace}>
          <Button
            title={loggingOut ? 'Signing out…' : 'Sign out'}
            disabled={loggingOut}
            onPress={() => {
              void signOut();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Fragment key={`${user.id}:${user.role}`}>
      {children}
    </Fragment>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    gap: 12,
  },
  title: {
    color: '#304439',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#93849E',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonSpace: { marginTop: 10 },
});