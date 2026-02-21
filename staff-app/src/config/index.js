// App Configuration
// Update these values based on your network setup

import { Platform, NativeModules } from 'react-native';

// For Android emulator connecting to host machine, use:
// - http://10.0.2.2:3001 (Android emulator special IP)
// - Or your computer's actual IP address (e.g., http://192.168.1.100:3001)

// For iOS simulator, use:
// - http://localhost:3001

// For physical devices on the same network, use your computer's IP:
// - Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your IP

// Server port
const SERVER_PORT = '3001';

// Get server IP based on platform and environment
const getServerIP = () => {
  // Check for environment variable first (for production builds)
  if (__DEV__ && NativeModules?.SourceCode?.scriptURL) {
    const scriptURL = NativeModules.SourceCode.scriptURL;
    // If running from a local development server, use the IP from the script URL
    if (scriptURL.includes('http://')) {
      const match = scriptURL.match(/http:\/\/([\d.]+):/);
      if (match) {
        return match[1];
      }
    }
  }

  // Environment variable support for different configurations
  // Can be set in app.config.js or .env files
  const envServerIP = typeof process !== 'undefined' && process.env?.SERVER_IP;
  if (envServerIP) {
    return envServerIP;
  }

  // Fallback defaults based on platform
  if (Platform.OS === 'android') {
    // For Android emulator, 10.0.2.2 maps to host machine's localhost
    return '10.0.2.2';
  }

  // For iOS simulator and development
  return 'localhost';
};

const SERVER_IP = getServerIP();

export const API_BASE_URL = Platform.OS === 'android'
  ? `http://${SERVER_IP}:${SERVER_PORT}`
  : `http://localhost:${SERVER_PORT}`;

export const SOCKET_URL = API_BASE_URL;

export const API_URL = `${API_BASE_URL}/api`;

export default {
  API_BASE_URL,
  SOCKET_URL,
  API_URL,
  SERVER_IP,
  SERVER_PORT,
};
