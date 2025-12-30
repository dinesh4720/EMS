import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../theme';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter phone number and password');
      return;
    }

    setLoading(true);
    const result = await login(phone.trim(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topSection}>
        <View style={styles.logoBubble}>
          <Feather name="layers" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Teacher App</Text>
        <Text style={styles.subtitle}>Welcome back, Educator.</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            placeholderTextColor={COLORS.gray}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={COLORS.gray}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.buttonWrapper}
        >
          <View style={styles.button}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.hint}>Demo: 1234567890 / demo</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fade, justifyContent: 'center', padding: 24 },

  topSection: { alignItems: 'center', marginBottom: 40 },
  logoBubble: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...SHADOWS.medium },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: COLORS.dark },
  subtitle: { fontSize: 16, color: COLORS.gray, marginTop: 8, fontFamily: 'Inter_400Regular' },

  formContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 32, ...SHADOWS.large },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: COLORS.dark, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  input: { backgroundColor: COLORS.fade, borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'Inter_400Regular', color: COLORS.dark },

  buttonWrapper: { marginTop: 8 },
  button: { backgroundColor: COLORS.primary, borderRadius: 100, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  footer: { marginTop: 24, alignItems: 'center' },
  hint: { color: COLORS.gray, fontSize: 12, fontFamily: 'Inter_400Regular' },
});
