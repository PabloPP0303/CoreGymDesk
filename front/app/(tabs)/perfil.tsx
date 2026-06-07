import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';

export default function PerfilScreen() {
  const { perfil, logout, actualizarPerfil } = useAuth();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: perfil?.nombre || '',
    apellidos: perfil?.apellidos || '',
    telefono: perfil?.telefono || '',
    peso: String(perfil?.peso || ''),
    altura: String(perfil?.altura || ''),
  });

  async function guardar() {
    try {
      await actualizarPerfil({
        nombre: form.nombre,
        apellidos: form.apellidos,
        telefono: form.telefono,
        peso: parseFloat(form.peso),
        altura: parseFloat(form.altura),
      });
      setEditando(false);
      Alert.alert('¡Guardado!', 'Perfil actualizado correctamente');
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>
            {perfil?.nombre?.[0]}{perfil?.apellidos?.[0]}
          </Text>
        </View>
        <Text style={styles.nombre}>{perfil?.nombre} {perfil?.apellidos}</Text>
        <Text style={styles.rol}>Socio · Gimnasio Combo</Text>
        <View style={styles.badgeGreen}>
          <Text style={styles.badgeGreenText}>Membresía activa</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <TouchableOpacity onPress={() => setEditando(!editando)}>
            <Text style={styles.editarBtn}>{editando ? 'Cancelar' : 'Editar'}</Text>
          </TouchableOpacity>
        </View>

        {editando ? (
          <View style={styles.card}>
            {[
              { campo: 'nombre', label: 'Nombre' },
              { campo: 'apellidos', label: 'Apellidos' },
              { campo: 'telefono', label: 'Teléfono' },
            ].map(({ campo, label }) => (
              <View key={campo} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={(form as any)[campo]}
                  onChangeText={v => setForm(prev => ({ ...prev, [campo]: v }))}
                  placeholderTextColor={Colors.muted}
                />
              </View>
            ))}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput style={styles.input} value={form.peso} onChangeText={v => setForm(p => ({ ...p, peso: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput style={styles.input} value={form.altura} onChangeText={v => setForm(p => ({ ...p, altura: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
              </View>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={guardar}>
              <Text style={styles.btnPrimaryText}>Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {[
              { label: 'Nombre', valor: `${perfil?.nombre} ${perfil?.apellidos}` },
              { label: 'Teléfono', valor: perfil?.telefono || '—' },
              { label: 'Peso', valor: perfil?.peso ? `${perfil.peso} kg` : '—' },
              { label: 'Altura', valor: perfil?.altura ? `${perfil.altura} cm` : '—' },
            ].map(({ label, valor }) => (
              <View key={label} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{label}</Text>
                <Text style={styles.dataValor}>{valor}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.btnDanger} onPress={logout}>
          <Text style={styles.btnDangerText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: { alignItems: 'center', padding: 24, paddingTop: 56, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.black, marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.black },
  nombre: { fontSize: 22, fontWeight: '700', color: Colors.text },
  rol: { fontSize: 13, color: Colors.muted, marginTop: 2, marginBottom: 10 },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  badgeGreenText: { fontSize: 12, color: Colors.green, fontWeight: '600' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  editarBtn: { fontSize: 13, color: Colors.accent },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dataLabel: { fontSize: 13, color: Colors.muted },
  dataValor: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5 },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, color: Colors.text, fontSize: 14 },
  row: { flexDirection: 'row' },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnDanger: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)' },
  btnDangerText: { color: Colors.red, fontWeight: '600', fontSize: 14 },
});