import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resUsuarios, resClases, resCuotas] = await Promise.all([
        axios.get(`${API_URL}/usuarios`, { headers }),
        axios.get(`${API_URL}/clases`),
        axios.get(`${API_URL}/cuotas`, { headers }),
      ]);
      setUsuarios(resUsuarios.data);
      setClases(resClases.data);
      setCuotas(resCuotas.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  const cuotasVencidas = cuotas.filter(c => c.estado === 'vencida').length;

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.red} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Panel Admin</Text>
          <Text style={styles.subtitulo}>Gimnasio Combo</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{usuarios.length}</Text>
          <Text style={styles.statLabel}>Socios</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{clases.length}</Text>
          <Text style={styles.statLabel}>Clases activas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.red }]}>{cuotasVencidas}</Text>
          <Text style={styles.statLabel}>Cuotas vencidas</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos socios</Text>
        {usuarios.slice(0, 5).map((u: any) => (
          <View key={u.id} style={styles.usuarioRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{u.nombre?.[0]}{u.apellidos?.[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.usuarioNombre}>{u.nombre} {u.apellidos}</Text>
              <Text style={styles.usuarioMeta}>{u.rol}</Text>
            </View>
            <View style={[styles.badge, u.rol === 'admin' ? styles.badgeRed : styles.badgeGreen]}>
              <Text style={[styles.badgeText, u.rol === 'admin' ? { color: Colors.red } : { color: Colors.green }]}>
                {u.rol}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clases activas</Text>
        {clases.slice(0, 4).map((c: any) => (
          <View key={c.id} style={styles.claseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.claseNombre}>{c.nombre}</Text>
              <Text style={styles.claseMeta}>{c.sala} · {c.hora_inicio}</Text>
            </View>
            <Text style={styles.claseAforo}>{c.reservas?.[0]?.count ?? 0}/{c.aforo_maximo}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 12, color: Colors.red, marginTop: 2 },
  logout: { fontSize: 13, color: Colors.muted },
  statsGrid: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 28, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 4 },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  usuarioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  usuarioNombre: { fontSize: 13, fontWeight: '600', color: Colors.text },
  usuarioMeta: { fontSize: 11, color: Colors.muted },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  claseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  claseNombre: { fontSize: 13, fontWeight: '600', color: Colors.text },
  claseMeta: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  claseAforo: { fontSize: 13, color: Colors.muted },
});