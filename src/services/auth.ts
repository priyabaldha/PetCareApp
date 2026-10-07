import * as SecureStore from 'expo-secure-store';

// Copy the SAME working address used in SignupScreen.tsx. No /api/health suffix.
export const API_BASE_URL = 'http://192.168.1.11:4000';
const TOKEN_KEY = 'jeeva.session.v1';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiResult = { success?: boolean; token?: string; message?: string; user?: unknown };

async function request(path: string, method: 'GET' | 'POST', body?: object, token?: string): Promise<ApiResult> {
  if (API_BASE_URL.includes('YOUR_WORKING_WIFI_IPV4')) {
    throw new Error('Set API_BASE_URL in src/services/auth.ts to your working Wi-Fi address.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const raw: unknown = await response.json().catch(() => null);
    const data: ApiResult = raw && typeof raw === 'object' ? raw as ApiResult : {};
    if (!response.ok) {
      throw new ApiError(typeof data.message === 'string' ? data.message : `Request failed (${response.status}).`, response.status);
    }
    if (data.success !== true) throw new ApiError('Unexpected server response.', response.status);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(controller.signal.aborted
      ? 'Request timed out. Check that your backend is running.'
      : 'Cannot reach the backend. Check the Wi-Fi address and connection.');
  } finally {
    clearTimeout(timer);
  }
}

export async function login(email: string, password: string): Promise<void> {
  const data = await request('/login', 'POST', { email: email.trim().toLowerCase(), password });
  if (typeof data.token !== 'string' || !/^[a-f0-9]{64}$/i.test(data.token)) {
    throw new Error('The server did not return a valid session.');
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  } catch {
    await request('/logout', 'POST', undefined, data.token).catch(() => undefined);
    throw new Error('Could not save your session on this device. Please try again.');
  }
}

export async function restoreSession(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return false;
  try {
    await request('/me', 'GET', undefined, token);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return false;
    }
    // Preserve the token on connection failures; RootNavigator offers Retry.
    throw error;
  }
}

// Ready for the Profile screen's logout button in the next step.
export async function logout(): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) await request('/logout', 'POST', undefined, token);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}


// Append this ONCE at the end of PetCareApp/src/services/auth.ts.
// Keep all existing imports, functions, and your working API_BASE_URL.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'pet_owner' | 'vet' | 'admin';
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string' && typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    (user.role === 'pet_owner' || user.role === 'vet' || user.role === 'admin');
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  try {
    const data = await request('/me', 'GET', undefined, token);
    if (!isAuthUser(data.user)) {
      throw new Error('The server returned incomplete profile details. Please retry.');
    }
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      return null;
    }
    // A temporary network error must not remove the saved session.
    throw error;
  }
}


// Append ONCE after the existing profile additions in src/services/auth.ts.
const sessionExpiredListeners = new Set<() => void>();
export function subscribeToSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}
async function expirePetSession(): Promise<never> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  sessionExpiredListeners.forEach((listener) => listener());
  throw new ApiError('Your session has expired. Sign in again.', 401);
}

export async function authenticatedRequest(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: object,
): Promise<Record<string, unknown>> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return expirePetSession();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (response.status === 401) return await expirePetSession();
    const raw: unknown = await response.json().catch(() => null);
    const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    if (!response.ok || data.success !== true) {
      throw new ApiError(typeof data.message === 'string' ? data.message : `Request failed (${response.status}).`, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(method === 'GET'
      ? 'Could not load data. Check your connection and retry.'
      : 'Could not confirm the change. Refresh the screen before retrying; it may already have been saved.');
  } finally { clearTimeout(timer); }
}

export async function updateProfileName(
  name: string,
): Promise<AuthUser> {
  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new Error(
      'Name must contain between 2 and 100 characters.',
    );
  }

  const data = await authenticatedRequest(
    '/api/auth/me',
    'PATCH',
    { name: trimmedName },
  );

  if (!isAuthUser(data.user)) {
    throw new Error(
      'Could not confirm the saved name. Refresh Profile to check it.',
    );
  }

  return data.user;
}