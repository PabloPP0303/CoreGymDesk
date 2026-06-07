import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, Colors } from '../../constants/theme';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';

export default function RegistroScreen() {
  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '',
    password: '', telefono: '', fecha_nacimiento: '',
  });
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  const { toast, mostrar, ocultar } = useToast();

  function actualizar(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleRegistro() {
    if (!form.nombre || !form.apellidos || !form.email || !form.password) {
      mostrar('Rellena todos los campos', 'error');
      return;
    }
    try {
      setCargando(true);
      console.log('Enviando:', form);
      await axios.post(`${API_URL}/auth/register`, form);
      mostrar('Registro completado, ya puedes iniciar sesión', 'success');
      router.replace('/(auth)/login');
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al registrarse', 'error');
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
          <Text style={styles.tagline}>Crear cuenta nueva</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.titulo}>Regístrate</Text>

          {[
            { campo: 'nombre', label: 'Nombre', placeholder: 'Pablo' },
            { campo: 'apellidos', label: 'Apellidos', placeholder: 'Pérez Palacín' },
            { campo: 'email', label: 'Email', placeholder: 'pablo@gmail.com', keyboard: 'email-address' },
            { campo: 'password', label: 'Contraseña', placeholder: '••••••••', secure: true },
            { campo: 'telefono', label: 'Teléfono', placeholder: '612 345 678', keyboard: 'phone-pad' },
            { campo: 'fecha_nacimiento', label: 'Fecha de nacimiento', placeholder: '2000-01-15' },
          ].map(({ campo, label, placeholder, keyboard, secure }) => (
            <View key={campo} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={(form as any)[campo]}
                onChangeText={v => actualizar(campo, v)}
                placeholder={placeholder}
                placeholderTextColor={Colors.muted}
                keyboardType={(keyboard as any) || 'default'}
                secureTextEntry={secure}
                autoCapitalize="none"
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleRegistro}
            disabled={cargando}
          >
            <Text style={styles.btnPrimaryText}>
              {cargando ? 'Registrando...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text>
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
  header: { marginBottom: 32, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '700', color: Colors.accent, letterSpacing: 2 },
  tagline: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  form: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border },
  titulo: { fontSize: 22, fontWeight: '600', color: Colors.text, marginBottom: 20, fontFamily: 'Inter_700Bold'},
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500', fontFamily: 'Inter_400Regular' },
  input: {
    backgroundColor: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular'
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 15, fontFamily: 'Inter_700Bold' },
  linkText: { textAlign: 'center', fontSize: 13, color: Colors.muted },
  linkAccent: { color: Colors.accent },
});