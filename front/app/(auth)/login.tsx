import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast, mostrar, ocultar } = useToast();

  async function handleLogin() {
    if (!email || !password) {
      mostrar('Rellena todos los campos', 'error');
      return;
    }
    try {
      setCargando(true);
      await login(email, password);
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Credenciales incorrectas', 'error');
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>CoreGymDesk</Text>
          <Text style={styles.tagline}>Gimnasio Combo · El Cuervo</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.titulo}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitulo}>Inicia sesión para continuar</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="pablo@coregym.es"
              placeholderTextColor={Colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.muted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleLogin}
            disabled={cargando}
          >
            <Text style={styles.btnPrimaryText}>
              {cargando ? 'Entrando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/registro')}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} onHide={ocultar} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: '700', color: Colors.accent, letterSpacing: 2 },
  tagline: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  form: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border },
  titulo: { fontSize: 22, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  subtitulo: { fontSize: 13, color: Colors.muted, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 15 },
  linkText: { textAlign: 'center', fontSize: 13, color: Colors.muted },
  linkAccent: { color: Colors.accent },
});