import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';
import { Confirmar } from '../../notificaciones/Confirmacion';
import { useConfirmar } from '../../hooks/useConfirmar';

export default function MisReservasScreen() {
  const { token } = useAuth();
  const [reservas, setReservas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [verHistorial, setVerHistorial] = useState(false);
  const { toast, mostrar, ocultar } = useToast();
  const { confirmar, pedir, cerrar } = useConfirmar();

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [])
  );

  async function cargarReservas() {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resProximas, resHistorial] = await Promise.all([
        axios.get(`${API_URL}/reservas`, { headers }),
        axios.get(`${API_URL}/reservas/historial`, { headers }),
      ]);

      setReservas(resProximas.data);
      setHistorial(resHistorial.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function cancelarReserva(id: number) {
    pedir('¿Cancelar esta reserva?', 'Esta acción no se puede deshacer.', async () => {
      try {
        await axios.delete(`${API_URL}/reservas?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        cargarReservas();
      } catch (e: any) {
        mostrar(e.response?.data?.error || 'Error al cancelar reserva', 'error');
      }
    }, true);
  }

  function getDiaSemana(fecha: string) {
    const dia = new Date(fecha + 'T00:00:00');
    return dia.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  return (
    <>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Mis reservas</Text>
          <Text style={styles.subtitulo}>{reservas.length} próximas</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, !verHistorial && styles.tabBtnActive]}
          onPress={() => setVerHistorial(false)}
        >
          <Text style={[styles.tabText, !verHistorial && styles.tabTextActive]}>Próximas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, verHistorial && styles.tabBtnActive]}
          onPress={() => setVerHistorial(true)}
        >
          <Text style={[styles.tabText, verHistorial && styles.tabTextActive]}>Historial</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {!verHistorial ? (
          reservas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color={Colors.muted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No tienes reservas próximas</Text>
              <Text style={styles.emptySubtext}>Explora las clases disponibles y reserva tu plaza</Text>
            </View>
          ) : (
            reservas.map((r: any) => (
              <View key={r.id} style={styles.reservaCard}>
                <View style={styles.reservaLeft}>
                  <View style={styles.reservaIconWrap}>
                    <Ionicons name="barbell-outline" size={20} color={Colors.accent} />
                  </View>
                </View>
                <View style={styles.reservaInfo}>
                  <Text style={styles.reservaNombre}>{r.clases?.nombre}</Text>
                  <Text style={styles.reservaMeta}>{getDiaSemana(r.fecha)}</Text>
                  <Text style={styles.reservaMeta}>{r.clases?.hora_inicio} – {r.clases?.hora_fin} · {r.clases?.sala}</Text>
                </View>
                <View style={styles.reservaRight}>
                  <View style={styles.badgeConfirmada}>
                    <Text style={styles.badgeConfirmadaText}>Confirmada</Text>
                  </View>
                  <TouchableOpacity style={styles.btnCancelar} onPress={() => cancelarReserva(r.id)}>
                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          historial.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay historial de reservas</Text>
            </View>
          ) : (
            historial.map((r: any) => (
              <View key={r.id} style={[styles.reservaCard, styles.reservaCardHistorial]}>
                <View style={styles.reservaLeft}>
                  <View style={[styles.reservaIconWrap, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                    <Ionicons name={r.estado === 'cancelada' ? 'close-outline' : 'checkmark-outline'} size={20} color={r.estado === 'cancelada' ? Colors.red : Colors.green}/>
                  </View>
                </View>
                <View style={styles.reservaInfo}>
                  <Text style={[styles.reservaNombre, { color: Colors.muted }]}>{r.clases?.nombre}</Text>
                  <Text style={styles.reservaMeta}>{getDiaSemana(r.fecha)}</Text>
                  <Text style={styles.reservaMeta}>{r.clases?.hora_inicio} – {r.clases?.hora_fin} · {r.clases?.sala}</Text>
                </View>
                <View style={[r.estado === 'cancelada' ? styles.badgeCancelada : styles.badgeConfirmada]}>
                  <Text style={[r.estado === 'cancelada' ? styles.badgeCanceladaText : styles.badgeConfirmadaText]}>
                    {r.estado === 'cancelada' ? 'Cancelada' : 'Asistida'}
                  </Text>
                </View>
              </View>
            ))
          )
        )}
      </View>
    </ScrollView>
    <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} onHide={ocultar} />
    <Confirmar visible={confirmar.visible} titulo={confirmar.titulo} mensaje={confirmar.mensaje} onConfirmar={() => { confirmar.onConfirmar(); cerrar(); }} onCancelar={cerrar}
      peligroso={confirmar.peligroso} textoConfirmar={confirmar.textoConfirmar}/>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: { padding: 20, paddingTop: 20, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  titulo: { fontSize: 26, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  tabsRow: { flexDirection: 'row', backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, padding: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabText: { fontSize: 13, color: Colors.muted },
  tabTextActive: { color: Colors.accent, fontWeight: '600' },
  section: { padding: 16 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  emptySubtext: { color: Colors.muted, fontSize: 12, textAlign: 'center' },
  reservaCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reservaCardHistorial: { opacity: 0.7 },
  reservaLeft: {},
  reservaIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(230,234,8,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(230,234,8,0.2)' },
  reservaInfo: { flex: 1 },
  reservaNombre: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  reservaMeta: { fontSize: 12, color: Colors.muted, marginBottom: 1 },
  reservaRight: { gap: 6, alignItems: 'flex-end' },
  badgeConfirmada: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  badgeConfirmadaText: { fontSize: 11, color: Colors.green, fontWeight: '600' },
  btnCancelar: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  badgeCancelada: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  badgeCanceladaText: { fontSize: 11, color: Colors.red, fontWeight: '600' },
  btnCancelarText: { color: Colors.red, fontSize: 12 },
});