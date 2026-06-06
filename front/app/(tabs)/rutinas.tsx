import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, Image
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_LABEL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function RutinasScreen() {
  const { token } = useAuth();
  const [rutinas, setRutinas] = useState<any[]>([]);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalRutina, setModalRutina] = useState(false);
  const [nombreRutina, setNombreRutina] = useState('');

  const [modalEjercicio, setModalEjercicio] = useState(false);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState<any>(null);
  const [ejercicioForm, setEjercicioForm] = useState({
    ejercicio_id: '',
    dia: 'lunes',
    series: '3',
    repeticiones: '10',
  });

  const [modalEditar, setModalEditar] = useState(false);
  const [ejercicioEditando, setEjercicioEditando] = useState<any>(null);
  const [editForm, setEditForm] = useState({ dia: '', series: '', repeticiones: '' });

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos() {
    try {
      const [resRutinas, resEjercicios] = await Promise.all([
        axios.get(`${API_URL}/rutinas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/ejercicios`),
      ]);
      setRutinas(resRutinas.data);
      setEjercicios(resEjercicios.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function crearRutina() {
    if (!nombreRutina.trim()) {
      window.alert('Escribe un nombre para la rutina');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/rutinas`,
        { nombre: nombreRutina, ejercicios: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNombreRutina('');
      setModalRutina(false);
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al crear rutina');
    }
  }

  async function eliminarRutina(id: number) {
    const confirmar = window.confirm('¿Eliminar esta rutina?');
    if (!confirmar) return;
    try {
      await axios.delete(`${API_URL}/rutinas?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al eliminar');
    }
  }

  async function añadirEjercicio() {
    if (!ejercicioForm.ejercicio_id) {
      window.alert('Selecciona un ejercicio');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/rutinas/ejercicio`,
        {
          rutina_id: rutinaSeleccionada.id,
          ejercicio_id: parseInt(ejercicioForm.ejercicio_id),
          dia: ejercicioForm.dia,
          series: parseInt(ejercicioForm.series),
          repeticiones: parseInt(ejercicioForm.repeticiones),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalEjercicio(false);
      setEjercicioForm({ ejercicio_id: '', dia: 'lunes', series: '3', repeticiones: '10' });
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al añadir ejercicio');
    }
  }

  async function editarEjercicio() {
    try {
      await axios.put(
        `${API_URL}/rutinas/ejercicio?id=${ejercicioEditando.id}`,
        {
          dia: editForm.dia,
          series: parseInt(editForm.series),
          repeticiones: parseInt(editForm.repeticiones),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalEditar(false);
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al editar ejercicio');
    }
  }

  async function eliminarEjercicioRutina(id: number) {
    try {
      await axios.delete(`${API_URL}/rutinas/ejercicio?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al eliminar ejercicio');
    }
  }

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Mis rutinas</Text>
          <Text style={styles.subtitulo}>{rutinas.length} rutinas activas</Text>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalRutina(true)}>
          <Text style={styles.btnPrimaryText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {rutinas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes rutinas creadas</Text>
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 12 }]} onPress={() => setModalRutina(true)}>
              <Text style={styles.btnPrimaryText}>Crear primera rutina</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rutinas.map((rutina: any) => (
            <View key={rutina.id} style={styles.rutinaCard}>
              <View style={styles.rutinaHeader}>
                <Text style={styles.rutinaNombre}>{rutina.nombre}</Text>
                <View style={styles.rutinaAcciones}>
                  <TouchableOpacity
                    style={styles.btnAñadir}
                    onPress={() => { setRutinaSeleccionada(rutina); setModalEjercicio(true); }}
                  >
                    <Text style={styles.btnAñadirText}>+ Ejercicio</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => eliminarRutina(rutina.id)}>
                    <Text style={styles.eliminarText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {DIAS.map((dia, i) => {
                const ejerciciosDia = rutina.rutina_ejercicios?.filter((re: any) => re.dia === dia) || [];
                if (ejerciciosDia.length === 0) return null;
                return (
                  <View key={dia} style={styles.diaSection}>
                    <Text style={styles.diaNombre}>{DIAS_LABEL[i]}</Text>
                    {ejerciciosDia.map((re: any) => (
                      <TouchableOpacity
                        key={re.id}
                        style={styles.ejercicioRow}
                        onPress={() => {
                          setEjercicioEditando(re);
                          setEditForm({ dia: re.dia, series: String(re.series), repeticiones: String(re.repeticiones) });
                          setModalEditar(true);
                        }}
                      >
                        {re.ejercicios?.imagen_url ? (
                          <Image
                            source={{ uri: re.ejercicios.imagen_url }}
                            style={{ width: 40, height: 40, borderRadius: 6, marginRight: 10 }}
                            resizeMode="cover"
                          />
                        ) : null}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ejercicioNombre}>{re.ejercicios?.nombre}</Text>
                          <Text style={styles.ejercicioGrupo}>{re.ejercicios?.grupo_muscular}</Text>
                        </View>
                        <Text style={styles.ejercicioSeries}>{re.series}×{re.repeticiones}</Text>
                        <TouchableOpacity
                          style={styles.btnBorrarEjercicio}
                          onPress={(e) => { e.stopPropagation(); eliminarEjercicioRutina(re.id); }}
                        >
                          <Text style={styles.btnBorrarEjercicioText}>✕</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}

              {(!rutina.rutina_ejercicios || rutina.rutina_ejercicios.length === 0) && (
                <Text style={styles.sinEjercicios}>Sin ejercicios. Pulsa "+ Ejercicio" para añadir.</Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Modal nueva rutina */}
      <Modal visible={modalRutina} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Nueva rutina</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={nombreRutina}
                onChangeText={setNombreRutina}
                placeholder="Rutina de fuerza..."
                placeholderTextColor={Colors.muted}
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => { setModalRutina(false); setNombreRutina(''); }}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={crearRutina}>
                <Text style={styles.btnPrimaryText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal añadir ejercicio */}
      <Modal visible={modalEjercicio} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Añadir ejercicio a "{rutinaSeleccionada?.nombre}"</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ejercicio</Text>
              <ScrollView style={styles.ejerciciosList} nestedScrollEnabled>
                {ejercicios.map(e => (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.ejercicioOption, ejercicioForm.ejercicio_id === String(e.id) && styles.ejercicioOptionActive]}
                    onPress={() => setEjercicioForm(p => ({ ...p, ejercicio_id: String(e.id) }))}
                  >
                    <Text style={[styles.ejercicioOptionText, ejercicioForm.ejercicio_id === String(e.id) && styles.ejercicioOptionTextActive]}>
                      {e.nombre}
                    </Text>
                    <Text style={styles.ejercicioOptionGrupo}>{e.grupo_muscular}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Día</Text>
              <View style={styles.diasRow}>
                {DIAS.map((dia, i) => (
                  <TouchableOpacity
                    key={dia}
                    style={[styles.diaBadge, ejercicioForm.dia === dia && styles.diaBadgeActive]}
                    onPress={() => setEjercicioForm(p => ({ ...p, dia }))}
                  >
                    <Text style={[styles.diaText, ejercicioForm.dia === dia && styles.diaTextActive]}>
                      {DIAS_LABEL[i].slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Series</Text>
                <TextInput style={styles.input} value={ejercicioForm.series} onChangeText={v => setEjercicioForm(p => ({ ...p, series: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Repeticiones</Text>
                <TextInput style={styles.input} value={ejercicioForm.repeticiones} onChangeText={v => setEjercicioForm(p => ({ ...p, repeticiones: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
              </View>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setModalEjercicio(false)}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={añadirEjercicio}>
                <Text style={styles.btnPrimaryText}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal editar ejercicio */}
      <Modal visible={modalEditar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Editar {ejercicioEditando?.ejercicios?.nombre}</Text>
            {ejercicioEditando?.ejercicios?.imagen_url ? (
              <Image
                source={{ uri: ejercicioEditando.ejercicios.imagen_url }}
                style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 16 }}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Día</Text>
              <View style={styles.diasRow}>
                {DIAS.map((dia, i) => (
                  <TouchableOpacity
                    key={dia}
                    style={[styles.diaBadge, editForm.dia === dia && styles.diaBadgeActive]}
                    onPress={() => setEditForm(p => ({ ...p, dia }))}
                  >
                    <Text style={[styles.diaText, editForm.dia === dia && styles.diaTextActive]}>
                      {DIAS_LABEL[i].slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Series</Text>
                <TextInput style={styles.input} value={editForm.series} onChangeText={v => setEditForm(p => ({ ...p, series: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Repeticiones</Text>
                <TextInput style={styles.input} value={editForm.repeticiones} onChangeText={v => setEditForm(p => ({ ...p, repeticiones: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
              </View>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setModalEditar(false)}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={editarEjercicio}>
                <Text style={styles.btnPrimaryText}>Guardar cambios</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  section: { padding: 16 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13 },
  rutinaCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  rutinaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rutinaNombre: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  rutinaAcciones: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnAñadir: { backgroundColor: 'rgba(200,241,53,0.12)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(200,241,53,0.3)' },
  btnAñadirText: { color: Colors.accent, fontSize: 12, fontWeight: '600' },
  eliminarText: { color: Colors.red, fontSize: 12 },
  diaSection: { marginBottom: 10 },
  diaNombre: { fontSize: 11, color: Colors.accent, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  ejercicioRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, marginBottom: 4 },
  ejercicioNombre: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  ejercicioGrupo: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  ejercicioSeries: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginRight: 8 },
  btnBorrarEjercicio: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.15)', justifyContent: 'center', alignItems: 'center' },
  btnBorrarEjercicioText: { color: Colors.red, fontSize: 11 },
  sinEjercicios: { fontSize: 12, color: Colors.muted, textAlign: 'center', padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '85%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14 },
  ejerciciosList: { maxHeight: 160, backgroundColor: Colors.dark, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  ejercicioOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ejercicioOptionActive: { backgroundColor: 'rgba(200,241,53,0.1)' },
  ejercicioOptionText: { fontSize: 13, color: Colors.text },
  ejercicioOptionTextActive: { color: Colors.accent, fontWeight: '600' },
  ejercicioOptionGrupo: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  diaBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  diaBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  diaText: { fontSize: 11, color: Colors.muted },
  diaTextActive: { color: Colors.black, fontWeight: '700' },
  row: { flexDirection: 'row' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14 },
});