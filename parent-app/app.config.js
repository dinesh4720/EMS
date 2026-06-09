const { expo } = require('./app.json');

const VALID_ENVS = new Set(['development', 'staging', 'production']);

const getValue = (value) => (
  typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const appEnv = (() => {
  const value = getValue(process.env.APP_ENV) ?? getValue(process.env.EXPO_PUBLIC_APP_ENV) ?? 'development';
  return VALID_ENVS.has(value) ? value : 'development';
})();

const envSuffix = appEnv.toUpperCase();

const resolveUrl = ({ genericKey, fallback }) => {
  const genericValue = getValue(process.env[genericKey]);
  const environmentValue = getValue(process.env[`${genericKey}_${envSuffix}`]);
  return genericValue ?? environmentValue ?? fallback;
};

const apiBaseUrl = resolveUrl({
  genericKey: 'EXPO_PUBLIC_API_BASE_URL',
  fallback: undefined,
});

if (!apiBaseUrl) {
  throw new Error(
    `Missing API base URL for APP_ENV="${appEnv}". Set EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_BASE_URL_${envSuffix}.`
  );
}

const socketUrl = resolveUrl({
  genericKey: 'EXPO_PUBLIC_SOCKET_URL',
  fallback: apiBaseUrl,
});

const easProjectId = getValue(process.env.EXPO_PUBLIC_EAS_PROJECT_ID) ?? getValue(process.env.EAS_PROJECT_ID);
const existingExtra = expo.extra || {};
const existingEas = existingExtra.eas || {};

module.exports = {
  ...expo,
  runtimeVersion: expo.runtimeVersion ?? {
    policy: 'appVersion',
  },
  updates: {
    ...(expo.updates || {}),
    ...(easProjectId ? { url: `https://u.expo.dev/${easProjectId}` } : {}),
  },
  extra: {
    ...existingExtra,
    ...((easProjectId || existingEas.projectId) ? {
      eas: {
        ...existingEas,
        ...(easProjectId ? { projectId: easProjectId } : {}),
      },
    } : {}),
    appEnv,
    updateChannel: appEnv,
    apiBaseUrl,
    socketUrl,
  },
};
