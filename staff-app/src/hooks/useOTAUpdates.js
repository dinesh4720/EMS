import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Hook to check for and apply OTA updates via Expo EAS Update.
 * Checks on mount, downloads in background, and prompts the user to reload.
 */
export function useOTAUpdates() {
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // Skip update checks in local development
        if (__DEV__) return;

        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Update Available',
            'A new version of the app is ready. Restart now to apply the update.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Restart Now',
                onPress: async () => {
                  await Updates.reloadAsync();
                },
              },
            ]
          );
        }
      } catch (error) {
        // Silently fail so a network or config issue never blocks app usage
        console.warn('OTA update check failed:', error.message);
      }
    }

    checkForUpdates();
  }, []);
}
