import { useCallback, useEffect, useState } from 'react';
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

  const hoy = new Date();
  const fecha = hoy.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>Bienvenido, {perfil?.nombre}</Text>
          <Text style={styles.fecha}>{fecha.charAt(0).toUpperCase() + fecha.slice(1)}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{reservas.length}</Text>
          <Text style={styles.statLabel}>Reservas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.green }]}>28</Text>
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
            { label: 'Mi progreso', ruta: '/(tabs)/perfil' },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  saludo: { fontSize: 20, fontWeight: '700', color: Colors.text },
  fecha: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  logout: { fontSize: 13, color: Colors.muted },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 28, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 4 },
  section: { padding: 16, paddingTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  verTodas: { fontSize: 12, color: Colors.accent },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13, marginBottom: 12 },
  reservaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  reservaNombre: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reservaMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  badgeAccent: { backgroundColor: 'rgba(200,241,53,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(200,241,53,0.3)' },
  badgeAccentText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border, width: '47%', alignItems: 'center' },
  quickBtnText: { color: Colors.text, fontSize: 13, fontWeight: '500' },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
});