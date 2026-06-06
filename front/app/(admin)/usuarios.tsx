import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';

export default function AdminUsuariosScreen() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalRutina, setModalRutina] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [nombreRutina, setNombreRutina] = useState('');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resUsuarios, resEjercicios] = await Promise.all([
        axios.get(`${API_URL}/usuarios`, { headers }),
        axios.get(`${API_URL}/ejercicios`),
      ]);
      setUsuarios(resUsuarios.data);
      setEjercicios(resEjercicios.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function eliminarUsuario(id: string, nombre: string) {
    const confirmar = window.confirm(`¿Eliminar al usuario ${nombre}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/usuarios?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert('Usuario eliminado correctamente');
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al eliminar usuario');
    }
  }

  async function cambiarRol(id: string, rolActual: string) {
    const nuevoRol = rolActual === 'admin' ? 'cliente' : 'admin';
    const confirmar = window.confirm(`¿Cambiar rol a ${nuevoRol}?`);
    if (!confirmar) return;

    try {
      await axios.put(`${API_URL}/usuarios?id=${id}`, { rol: nuevoRol }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al cambiar rol');
    }
  }

  async function asignarRutina() {
    if (!nombreRutina.trim()) {
      window.alert('Escribe un nombre para la rutina');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/rutinas`,
        { nombre: nombreRutina, usuario_id: usuarioSeleccionado.id, ejercicios: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert(`Rutina "${nombreRutina}" asignada a ${usuarioSeleccionado.nombre}`);
      setModalRutina(false);
      setNombreRutina('');
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al asignar rutina');
    }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Usuarios</Text>
          <Text style={styles.subtitulo}>{usuarios.length} socios registrados</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar usuario..."
          placeholderTextColor={Colors.muted}
        />
      </View>

      <View style={styles.section}>
        {usuariosFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        ) : (
          usuariosFiltrados.map((u: any) => (
            <View key={u.id} style={styles.usuarioCard}>
              <View style={styles.usuarioTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{u.nombre?.[0]}{u.apellidos?.[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.usuarioNombre}>{u.nombre} {u.apellidos}</Text>
                  <Text style={styles.usuarioMeta}>{u.telefono || 'Sin teléfono'}</Text>
                  <Text style={styles.usuarioMeta}>
                    {u.peso ? `${u.peso}kg` : '—'} · {u.altura ? `${u.altura}cm` : '—'}
                  </Text>
                </View>
                <View style={[styles.badge, u.rol === 'admin' ? styles.badgeRed : styles.badgeGreen]}>
                  <Text style={[styles.badgeText, { color: u.rol === 'admin' ? Colors.red : Colors.green }]}>
                    {u.rol}
                  </Text>
                </View>
              </View>
              <View style={styles.acciones}>
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => { setUsuarioSeleccionado(u); setModalRutina(true); }}
                >
                  <Text style={styles.btnAccionText}>Asignar rutina</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => cambiarRol(u.id, u.rol)}
                >
                  <Text style={styles.btnAccionText}>
                    {u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAccion}
                  onPress={() => router.push('/(admin)/cuotas')}
                >
                    <Text style={styles.btnAccionText}>Gestionar cuota</Text>
                </TouchableOpacity>                
                <TouchableOpacity
                  style={styles.btnEliminar}
                  onPress={() => eliminarUsuario(u.id, `${u.nombre} ${u.apellidos}`)}
                >
                  <Text style={styles.btnEliminarText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={modalRutina} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              Asignar rutina a {usuarioSeleccionado?.nombre}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de la rutina</Text>
              <TextInput
                style={styles.input}
                value={nombreRutina}
                onChangeText={setNombreRutina}
                placeholder="Rutina de fuerza..."
                placeholderTextColor={Colors.muted}
              />
            </View>
            <Text style={styles.infoText}>
              La rutina se creará vacía. El usuario podrá añadir ejercicios desde su perfil.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => { setModalRutina(false); setNombreRutina(''); }}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={asignarRutina}>
                <Text style={styles.btnPrimaryText}>Asignar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: { padding: 20, paddingTop: 56, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  searchWrap: { padding: 16, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, color: Colors.text, fontSize: 14 },
  section: { padding: 16 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13 },
  usuarioCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  usuarioTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  usuarioNombre: { fontSize: 14, fontWeight: '600', color: Colors.text },
  usuarioMeta: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  acciones: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btnAccion: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  btnAccionText: { color: Colors.blue, fontSize: 12, fontWeight: '500' },
  btnEliminar: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  btnEliminarText: { color: Colors.red, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14 },
  infoText: { fontSize: 12, color: Colors.muted, marginBottom: 16, lineHeight: 18 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14 },
});