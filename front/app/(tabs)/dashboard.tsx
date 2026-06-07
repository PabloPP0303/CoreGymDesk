import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';

export default function DashboardScreen() {
  const { perfil, token, logout } = useAuth();
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const [cuota, setCuota] = useState<any>(null);
  const diasRestantes = cuota?.fecha_vencimiento
    ? Math.max(0, Math.ceil((new Date(cuota.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const hoy = new Date();
  const fecha = hoy.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
      cargarCuota();
    }, [])
  );

  async function cargarReservas() {
    try {
      const res = await axios.get(`${API_URL}/reservas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservas(res.data.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function cargarCuota() {
    try {
      const res = await axios.get(`${API_URL}/cuotas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCuota(res.data);
    } catch (e) {
      const error = e as any;
      if (error.response?.status === 404) {
        setCuota(null);
      } else {
        console.error(e);
      }
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftSimple}>
          <Text style={styles.titulo}>Bienvenido, {perfil?.nombre}</Text>
          <Text style={styles.subtitulo}>{fecha.charAt(0).toUpperCase() + fecha.slice(1)}</Text>
        </View>
        <View style={styles.headerRightSimple}>
          <TouchableOpacity style={styles.btnSalir} onPress={logout}>
            <Text style={styles.btnSalirText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{reservas.length}</Text>
          <Text style={styles.statLabel}>Reservas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: diasRestantes !== null && diasRestantes <= 5 ? Colors.red : Colors.green }]}>{diasRestantes ?? '—'}</Text>
          <Text style={styles.statLabel}>Días cuota</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{perfil?.peso ?? '—'}<Text style={{ fontSize: 14 }}>kg</Text></Text>
          <Text style={styles.statLabel}>Peso</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas clases</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/clases')}>
            <Text style={styles.verTodas}>Ver todas →</Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator color={Colors.accent} />
        ) : reservas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes reservas próximas</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(tabs)/clases')}>
              <Text style={styles.btnPrimaryText}>Explorar clases</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reservas.map((r: any) => (
            <View key={r.id} style={styles.reservaCard}>
              <View>
                <Text style={styles.reservaNombre}>{r.clases?.nombre}</Text>
                <Text style={styles.reservaMeta}>{r.fecha} · {r.clases?.hora_inicio} · {r.clases?.sala}</Text>
              </View>
              <View style={styles.badgeAccent}>
                <Text style={styles.badgeAccentText}>Inscrito</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          {[
            { label: 'Mis rutinas', ruta: '/(tabs)/rutinas' },
            { label: 'Mi progreso', ruta: '/(tabs)/progreso' },
            { label: 'Tienda', ruta: '/(tabs)/tienda' },
            { label: 'Mi perfil', ruta: '/(tabs)/perfil' },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickBtn}
              onPress={() => router.push(item.ruta as any)}
            >
              <Text style={styles.quickBtnText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',paddingHorizontal: 16,paddingVertical: 14, width: '100%',backgroundColor: Colors.black, },
  headerLeftSimple: {flexDirection: 'column'},
  headerRightSimple: {justifyContent: 'center',alignItems: 'flex-end'},
  saludo: { fontSize: 20, fontWeight: '700', color: Colors.text },
  fecha: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  logout: { fontSize: 13, color: Colors.muted },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 28, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 16, width: '100%' },  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },  verTodas: { fontSize: 12, color: Colors.accent },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13, marginBottom: 12 },
  reservaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  reservaNombre: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reservaMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  badgeAccent: { backgroundColor: 'rgba(200,241,53,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(200,241,53,0.3)' },
  badgeAccentText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  quickBtn: { width: '48%', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  quickBtnText: { color: Colors.text, fontWeight: '600', fontSize: 15 },  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnSalir: {paddingHorizontal: 12,paddingVertical: 8,},
  btnSalirText: {color: Colors.muted, fontSize: 15},
  titulo: {fontSize: 24,fontWeight: 'bold',color: Colors.text},
  subtitulo: {fontSize: 14,color: Colors.muted, marginTop: 2},
});