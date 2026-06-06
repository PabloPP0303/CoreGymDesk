import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProgresoScreen() {
  const { token } = useAuth();
  const [registros, setRegistros] = useState<any[]>([]);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    ejercicio_id: '',
    peso_levantado: '',
    repeticiones: '',
  });

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos() {
    try {
      const [resProgreso, resEjercicios] = await Promise.all([
        axios.get(`${API_URL}/progreso`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/ejercicios`),
      ]);
      setRegistros(resProgreso.data);
      setEjercicios(resEjercicios.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function guardarRegistro() {
    try {
      const body: any = { fecha: form.fecha };
      if (form.peso) body.peso = parseFloat(form.peso);
      if (form.altura) body.altura = parseFloat(form.altura);
      if (form.ejercicio_id) body.ejercicio_id = parseInt(form.ejercicio_id);
      if (form.peso_levantado) body.peso_levantado = parseFloat(form.peso_levantado);
      if (form.repeticiones) body.repeticiones = parseInt(form.repeticiones);

      await axios.post(`${API_URL}/progreso`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModal(false);
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        peso: '', altura: '', ejercicio_id: '', peso_levantado: '', repeticiones: '',
      });
      cargarDatos();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'Error al guardar registro');
    }
  }

  // Últimos registros de peso
  const registrosPeso = registros.filter(r => r.peso).slice(0, 5);

  // Mejor marca por ejercicio
  const marcasPorEjercicio = ejercicios.reduce((acc: any, ej: any) => {
    const registrosEj = registros.filter(r => r.ejercicio_id === ej.id && r.peso_levantado);
    if (registrosEj.length > 0) {
      const mejor = Math.max(...registrosEj.map(r => r.peso_levantado));
      acc[ej.id] = { nombre: ej.nombre, mejor };
    }
    return acc;
  }, {});

  const ultimoPeso = registrosPeso[0]?.peso;
  const pesoAnterior = registrosPeso[1]?.peso;
  const diferenciaPeso = ultimoPeso && pesoAnterior ? (ultimoPeso - pesoAnterior).toFixed(1) : null;

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Mi progreso</Text>
          <Text style={styles.subtitulo}>{registros.length} registros</Text>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => setModal(true)}>
          <Text style={styles.btnPrimaryText}>+ Añadir</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>
            {ultimoPeso ? `${ultimoPeso}kg` : '—'}
          </Text>
          <Text style={styles.statLabel}>Peso actual</Text>
          {diferenciaPeso && (
            <Text style={[styles.statDelta, { color: parseFloat(diferenciaPeso) < 0 ? Colors.green : Colors.red }]}>
              {parseFloat(diferenciaPeso) > 0 ? '+' : ''}{diferenciaPeso}kg
            </Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>
            {Object.keys(marcasPorEjercicio).length}
          </Text>
          <Text style={styles.statLabel}>Ejercicios registrados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>
            {registros.length}
          </Text>
          <Text style={styles.statLabel}>Total registros</Text>
        </View>
      </View>

      
      {registrosPeso.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de peso</Text>
          {registrosPeso.map((r: any, i: number) => (
            <View key={r.id} style={styles.pesoRow}>
              <View style={styles.pesoLeft}>
                <Ionicons name="scale-outline" size={16} color={Colors.muted} />
                <Text style={styles.pesoFecha}>{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <Text style={styles.pesoValor}>{r.peso} kg</Text>
              {i > 0 && registrosPeso[i - 1]?.peso && (
                <Text style={[styles.pesoDelta, {
                  color: r.peso < registrosPeso[i - 1].peso ? Colors.green : Colors.red
                }]}>
                  {(r.peso - registrosPeso[i - 1].peso) > 0 ? '+' : ''}
                  {(r.peso - registrosPeso[i - 1].peso).toFixed(1)}kg
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      
      {Object.keys(marcasPorEjercicio).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mejores marcas</Text>
          {Object.values(marcasPorEjercicio).map((m: any, i: number) => (
            <View key={i} style={styles.marcaCard}>
              <View style={styles.marcaIconWrap}>
                <Ionicons name="trophy-outline" size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.marcaNombre}>{m.nombre}</Text>
              </View>
              <Text style={styles.marcaPeso}>{m.mejor} kg</Text>
            </View>
          ))}
        </View>
      )}

      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos registros</Text>
        {registros.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="stats-chart-outline" size={40} color={Colors.muted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No hay registros aún</Text>
            <Text style={styles.emptySubtext}>Añade tu primer registro de progreso</Text>
          </View>
        ) : (
          registros.slice(0, 10).map((r: any) => (
            <View key={r.id} style={styles.registroCard}>
              <Text style={styles.registroFecha}>
                {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <View style={styles.registroData}>
               {r.peso && (<View style={[styles.registroChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}><Ionicons name="scale-outline" size={14} color={Colors.muted} /><Text style={styles.registroChipText}>{r.peso}kg</Text></View>)}
               {r.altura && (<View style={[styles.registroChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}><Ionicons name="man-outline" size={14} color={Colors.muted} /><Text style={styles.registroChipText}>{r.altura}cm</Text></View>)}
               {r.ejercicios && (<View style={[styles.registroChip, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}><Ionicons name="barbell-outline" size={14} color={Colors.muted} /><Text style={styles.registroChipText}>{r.ejercicios.nombre}: {r.peso_levantado}kg × {r.repeticiones}</Text></View>)}
              </View>
            </View>
          ))
        )}
      </View>

      
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Añadir registro</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha</Text>
              <TextInput style={styles.input} value={form.fecha} onChangeText={v => setForm(p => ({ ...p, fecha: v }))} placeholderTextColor={Colors.muted} />
            </View>

            <View><Text style={styles.sectionLabel}>Medidas corporales</Text></View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput style={styles.input} value={form.peso} onChangeText={v => setForm(p => ({ ...p, peso: v }))} keyboardType="numeric" placeholder="74.5" placeholderTextColor={Colors.muted} />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput style={styles.input} value={form.altura} onChangeText={v => setForm(p => ({ ...p, altura: v }))} keyboardType="numeric" placeholder="178" placeholderTextColor={Colors.muted} />
              </View>
            </View>

            <View><Text style={styles.sectionLabel}>Levantamiento (opcional)</Text></View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ejercicio</Text>
              <ScrollView style={styles.ejerciciosList} nestedScrollEnabled>
                <TouchableOpacity
                  style={[styles.ejercicioOption, !form.ejercicio_id && styles.ejercicioOptionActive]}
                  onPress={() => setForm(p => ({ ...p, ejercicio_id: '' }))}
                >
                  <Text style={[styles.ejercicioOptionText, !form.ejercicio_id && styles.ejercicioOptionTextActive]}>Ninguno</Text>
                </TouchableOpacity>
                {ejercicios.map(e => (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.ejercicioOption, form.ejercicio_id === String(e.id) && styles.ejercicioOptionActive]}
                    onPress={() => setForm(p => ({ ...p, ejercicio_id: String(e.id) }))}
                  >
                    <Text style={[styles.ejercicioOptionText, form.ejercicio_id === String(e.id) && styles.ejercicioOptionTextActive]}>
                      {e.nombre}
                    </Text>
                    <Text style={styles.ejercicioOptionGrupo}>{e.grupo_muscular}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {form.ejercicio_id !== ''&& (
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Peso levantado (kg)</Text>
                  <TextInput style={styles.input} value={form.peso_levantado} onChangeText={v => setForm(p => ({ ...p, peso_levantado: v }))} keyboardType="numeric" placeholder="100" placeholderTextColor={Colors.muted} />
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Repeticiones</Text>
                  <TextInput style={styles.input} value={form.repeticiones} onChangeText={v => setForm(p => ({ ...p, repeticiones: v }))} keyboardType="numeric" placeholder="5" placeholderTextColor={Colors.muted} />
                </View>
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setModal(false)}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={guardarRegistro}>
                <Text style={styles.btnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 4 },
  statDelta: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  sectionLabel: { fontSize: 12, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 0 },
  pesoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  pesoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  pesoFecha: { fontSize: 13, color: Colors.muted },
  pesoValor: { fontSize: 14, fontWeight: '600', color: Colors.text },
  pesoDelta: { fontSize: 12, fontWeight: '600', marginLeft: 8 },
  marcaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  marcaIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(230,234,8,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(230,234,8,0.2)' },
  marcaNombre: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  marcaPeso: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  registroCard: { backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  registroFecha: { fontSize: 12, color: Colors.muted, marginBottom: 8 },
  registroData: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  registroChip: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  registroChipText: { fontSize: 12, color: Colors.text },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  emptySubtext: { color: Colors.muted, fontSize: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '85%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14 },
  row: { flexDirection: 'row' },
  ejerciciosList: { maxHeight: 160, backgroundColor: Colors.dark, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  ejercicioOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ejercicioOptionActive: { backgroundColor: 'rgba(230,234,8,0.1)' },
  ejercicioOptionText: { fontSize: 13, color: Colors.text },
  ejercicioOptionTextActive: { color: Colors.accent, fontWeight: '600' },
  ejercicioOptionGrupo: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14 },
});