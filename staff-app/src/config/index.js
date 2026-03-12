// App Configuration
// API and socket URLs are resolved from Expo environment config.

import Constants from 'expo-constants';

const expoExtra = Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? Constants.manifest?.extra ?? {};

const getValue = (value) => (
  typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const getConfigValue = (envKey, extraKey, fallback) => (
  getValue(typeof process !== 'undefined' ? process.env?.[envKey] : undefined)
  ?? getValue(expoExtra?.[extraKey])
  ?? fallback
);

export const APP_ENV = getConfigValue('EXPO_PUBLIC_APP_ENV', 'appEnv', 'development');

const resolveApiBaseUrl = () => {
  const url = getConfigValue('EXPO_PUBLIC_API_BASE_URL', 'apiBaseUrl', undefined);
  if (!url) {
    if (APP_ENV === 'production') {
      throw new Error(
        '[Config] EXPO_PUBLIC_API_BASE_URL is required in production. ' +
        'Set it in your EAS environment or .env file.'
      );
    }
    console.warn(
      '[Config] EXPO_PUBLIC_API_BASE_URL is not set. ' +
      'API calls will fail until this is configured. ' +
      'Set it in your .env.local file (e.g. EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3001).'
    );
    return '';
  }
  return url;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const SOCKET_URL = getConfigValue('EXPO_PUBLIC_SOCKET_URL', 'socketUrl', API_BASE_URL);
export const API_URL = `${API_BASE_URL}/api`;

export default {
  APP_ENV,
  API_BASE_URL,
  SOCKET_URL,
  API_URL,
};
