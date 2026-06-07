
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

function RutasProtegidas() {
  const { usuario, perfil, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const enAuth = segments[0] === '(auth)';

    if (!usuario && !enAuth) {
      router.replace('/(auth)/login');
    } else if (usuario && enAuth) {
      if (perfil?.rol === 'admin') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [usuario, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RutasProtegidas />
    </AuthProvider>
  );
}
