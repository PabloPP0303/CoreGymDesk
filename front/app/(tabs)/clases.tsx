import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ClasesScreen() {
  const { token } = useAuth();
  const [clases, setClases] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const hoy = new Date();
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoy);
    dia.setDate(hoy.getDate() + i);
    return dia;
  });

  useFocusEffect(
    useCallback(() => {
      cargarClases();
    }, [])
  );

  async function cargarClases() {
    try {
      const res = await axios.get(`${API_URL}/clases`);
      setClases(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function reservar(claseId: number) {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      await axios.post(
        `${API_URL}/reservas`,
        { clase_id: claseId, fecha: hoy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert('¡Reserva confirmada! Te has apuntado a la clase correctamente');
      cargarClases();
    } catch (e: any) {
      window.alert(e.response?.data?.error || 'No se pudo reservar');
    }
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Clases</Text>
        <Text style={styles.subtitulo}>Calendario semanal</Text>
      </View>
      <View style={styles.divisor} />

    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarRow}>
      {diasSemana.map((dia, i) => {
        const nombreDia = dia.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        return (
          <View key={i} style={[styles.diaCol, i === 0 && styles.diaColHoy]}>
            <Text style={[styles.diaNombre, i === 0 && styles.diaHoyText]}>
              {dia.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
            </Text>
            <Text style={[styles.diaNum, i === 0 && styles.diaHoyText]}>
              {dia.getDate()}
            </Text>
            {clases
              .filter(c => c.dias?.includes(nombreDia))
              .slice(0, 2)
              .map((c: any) => (
                <View key={c.id} style={styles.calClase}>
                  <Text style={styles.calClaseText} numberOfLines={1}>{c.nombre}</Text>
                </View>
              ))}
          </View>
        );
      })}
    </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Todas las clases</Text>
        {clases.length === 0 ? (
          <Text style={styles.emptyText}>No hay clases disponibles</Text>
        ) : (
          clases.map((clase: any) => {
            const plazasOcupadas = clase.reservas?.[0]?.count ?? 0;
            const llena = plazasOcupadas >= clase.aforo_maximo;

            return (
              <View key={clase.id} style={styles.claseCard}>
                <View style={styles.claseCardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.claseNombre}>{clase.nombre}</Text>
                    <Text style={styles.claseMeta}>{clase.sala} · {clase.hora_inicio} – {clase.hora_fin}</Text>
                    <Text style={styles.claseMeta}>{clase.descripcion}</Text>
                  </View>
                  <View style={[styles.badge, llena ? styles.badgeRed : styles.badgeGreen]}>
                    <Text style={[styles.badgeText, { color: llena ? Colors.red : Colors.green }]}>
                      {llena ? 'Aforo completo' : `${plazasOcupadas}/${clase.aforo_maximo}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={llena ? styles.btnDisabled : styles.btnPrimary}
                  onPress={() => reservar(clase.id)}
                  disabled={llena}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="bookmark-outline" size={16} color={llena ? Colors.red : Colors.black} style={{ marginRight: 6 }} />
                    <Text style={llena ? styles.btnDisabledText : styles.btnPrimaryText}>
                      {llena ? 'Aforo completo' : 'Reservar plaza'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: {flexDirection: 'column',justifyContent: 'center',paddingHorizontal: 16,paddingTop: 20,paddingBottom: 16,width: '100%',backgroundColor: Colors.black},
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  calendarRow: { paddingHorizontal: 12, paddingVertical: 14, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  diaCol: { width: 80, marginRight: 8, backgroundColor: Colors.card, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: Colors.border },
  diaColHoy: { borderColor: Colors.accent },
  diaNombre: { fontSize: 11, color: Colors.muted, textAlign: 'center', textTransform: 'uppercase' },
  diaNum: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  diaHoyText: { color: Colors.accent },
  calClase: { backgroundColor: 'rgba(200,241,53,0.1)', borderRadius: 4, padding: 3, marginBottom: 3 },
  calClaseText: { fontSize: 9, color: Colors.accent },
  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptyText: { color: Colors.muted, fontSize: 13 },
  claseCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  claseCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' },
  claseNombre: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  claseMeta: { fontSize: 12, color: Colors.muted, marginBottom: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnDisabled: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  btnDisabledText: { color: Colors.red, fontWeight: '700', fontSize: 14 },
  divisor: {height: 1,width: '100%',backgroundColor: Colors.border,marginBottom: 0},
});