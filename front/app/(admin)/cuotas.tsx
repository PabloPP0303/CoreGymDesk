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
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';
import { Confirmar } from '../../notificaciones/Confirmacion';
import { useConfirmar } from '../../hooks/useConfirmar';

export default function AdminCuotasScreen() {
  const { token } = useAuth();
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [modal, setModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const {toast, mostrar, ocultar} = useToast();
  const { confirmar, pedir, cerrar } = useConfirmar();
  const [form, setForm] = useState({
    importe: '30',
    fecha_pago: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
  });
  const hoy = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resCuotas, resUsuarios] = await Promise.all([
        axios.get(`${API_URL}/cuotas`, { headers }),
        axios.get(`${API_URL}/usuarios`, { headers }),
      ]);
      setCuotas(resCuotas.data);
      setUsuarios(resUsuarios.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  function abrirModal(cuota: any) {
    const usuario = usuarios.find(u => u.id === cuota.usuario_id);
    setUsuarioSeleccionado(usuario);
    setForm({
      importe: String(cuota.importe || 30),
      fecha_pago: cuota.fecha_pago || new Date().toISOString().split('T')[0],
      fecha_vencimiento: cuota.fecha_vencimiento || '',
    });
    setModal(true);
  }

  async function guardarCuota() {
    if (!form.fecha_vencimiento) {
      mostrar('Introduce la fecha de vencimiento', 'error');
      return;
    }
      if (form.fecha_vencimiento < hoy) {
          mostrar('La fecha de vencimiento no puede ser anterior a hoy', 'error');
          return;
      }

      if (form.fecha_pago < hoy) {
          mostrar('La fecha de pago no puede ser anterior a hoy', 'error');
          return;
      }
    try {
      const cuotaExistente = cuotas.find(c => c.usuario_id === usuarioSeleccionado.id);
      if (cuotaExistente) {
        await axios.put(
          `${API_URL}/cuotas?id=${cuotaExistente.id}`,
          { importe: parseFloat(form.importe), fecha_pago: form.fecha_pago, fecha_vencimiento: form.fecha_vencimiento, estado: 'al_dia' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/cuotas`,
          { usuario_id: usuarioSeleccionado.id, importe: parseFloat(form.importe), fecha_pago: form.fecha_pago, fecha_vencimiento: form.fecha_vencimiento },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setModal(false);
      cargarDatos();
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al guardar cuota', 'error');
    }
  }
    async function cancelarCuota(id: number) {
        pedir('¿Cancelar esta cuota?','Esta acción no se puede deshacer.', async () => {
        try {
            await axios.put(
                `${API_URL}/cuotas?id=${id}`,
                { estado: 'vencida' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            mostrar('Cuota cancelada correctamente', 'success');
            cargarDatos();
        } catch (e: any) {
            mostrar(e.response?.data?.error || 'Error al cancelar cuota', 'error');
        }
        }, true);
    }

  async function marcarPagada(cuota: any) {
    const hoy = new Date();
    const vencimiento = new Date(hoy);
    vencimiento.setMonth(vencimiento.getMonth() + 1);

    try {
      await axios.put(
        `${API_URL}/cuotas?id=${cuota.id}`,
        {
          estado: 'al_dia',
          fecha_pago: hoy.toISOString().split('T')[0],
          fecha_vencimiento: vencimiento.toISOString().split('T')[0],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cargarDatos();
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al actualizar cuota', 'error');
    }
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'al_dia': return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: Colors.green, label: 'Al día' };
      case 'vencida': return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: Colors.red, label: 'Vencida' };
      default: return { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', color: Colors.orange, label: 'Pendiente' };
    }
  }

  const cuotasFiltradas = filtro === 'Todos'
    ? cuotas
    : cuotas.filter(c => {
        if (filtro === 'Al día') return c.estado === 'al_dia';
        if (filtro === 'Vencidas') return c.estado === 'vencida';
        if (filtro === 'Pendientes') return c.estado === 'pendiente';
        return true;
      });

  const vencidas = cuotas.filter(c => c.estado === 'vencida').length;
  const alDia = cuotas.filter(c => c.estado === 'al_dia').length;
  const pendientes = cuotas.filter(c => c.estado === 'pendiente').length;

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.titulo}>Cuotas</Text>
                    <Text style={styles.subtitulo}>Control de membresías</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNum, { color: Colors.green }]}>{alDia}</Text>
                        <Text style={styles.statLabel}>Al día</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNum, { color: Colors.red }]}>{vencidas}</Text>
                        <Text style={styles.statLabel}>Vencidas</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statNum, { color: Colors.orange }]}>{pendientes}</Text>
                        <Text style={styles.statLabel}>Pendientes</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosRow}>
                    {['Todos', 'Al día', 'Vencidas', 'Pendientes'].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filtroBadge, filtro === f && styles.filtroBadgeActive]}
                            onPress={() => setFiltro(f)}
                        >
                            <Text style={[styles.filtroText, filtro === f && styles.filtroTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.section}>
                    {cuotasFiltradas.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No hay cuotas en esta categoría</Text>
                        </View>
                    ) : (
                        cuotasFiltradas.map((cuota: any) => {
                            const usuario = usuarios.find(u => u.id === cuota.usuario_id);
                            const badge = getEstadoBadge(cuota.estado);
                            return (
                                <View key={cuota.id} style={styles.cuotaCard}>
                                    <View style={styles.cuotaTop}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {usuario?.nombre?.[0]}{usuario?.apellidos?.[0]}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.usuarioNombre}>{usuario?.nombre} {usuario?.apellidos}</Text>
                                            <Text style={styles.cuotaMeta}>
                                                {cuota.importe}€ · Vence: {cuota.fecha_vencimiento || 'Sin fecha'}
                                            </Text>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                                            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cuotaAcciones}>
                                        {cuota.estado !== 'al_dia' && (
                                            <TouchableOpacity style={styles.btnPagar} onPress={() => marcarPagada(cuota)}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    {cuota.estado === 'vencida' && (
                                                        <Ionicons name="warning-outline" size={14} color={Colors.accent} />
                                                    )}
                                                    <Text style={[styles.btnPagarText, cuota.estado === 'vencida' && { color: Colors.accent }]}>
                                                        {cuota.estado === 'vencida' ? 'Cuota vencida - Marcar pagada' : 'Marcar pagada'}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity style={styles.btnEditar} onPress={() => abrirModal(cuota)}>
                                            <Text style={styles.btnEditarText}>Editar</Text>
                                        </TouchableOpacity>
                                        {cuota.estado === 'al_dia' && (
                                            <TouchableOpacity style={styles.btnEliminar} onPress={() => cancelarCuota(cuota.id)}>
                                                <Text style={styles.btnEliminarText}>Cancelar cuota</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Usuarios sin cuota asignada</Text>
                    {usuarios
                        .filter(u => u.rol === 'cliente' && !cuotas.find(c => c.usuario_id === u.id))
                        .map(u => (
                            <View key={u.id} style={styles.sinCuotaCard}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{u.nombre?.[0]}{u.apellidos?.[0]}</Text>
                                </View>
                                <Text style={[styles.usuarioNombre, { flex: 1 }]}>{u.nombre} {u.apellidos}</Text>
                                <TouchableOpacity
                                    style={styles.btnAsignar}
                                    onPress={() => {
                                        setUsuarioSeleccionado(u);
                                        setForm({ importe: '30', fecha_pago: new Date().toISOString().split('T')[0], fecha_vencimiento: '' });
                                        setModal(true);
                                    }}
                                >
                                    <Text style={styles.btnAsignarText}>Asignar cuota</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                </View>

                <Modal visible={modal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitulo}>
                                Cuota de {usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellidos}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Importe (€)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.importe}
                                    onChangeText={v => setForm(p => ({ ...p, importe: v }))}
                                    keyboardType="numeric"
                                    placeholderTextColor={Colors.muted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fecha de pago</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.fecha_pago}
                                    onChangeText={v => setForm(p => ({ ...p, fecha_pago: v }))}
                                    placeholder="2026-06-01"
                                    placeholderTextColor={Colors.muted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Fecha de vencimiento *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.fecha_vencimiento}
                                    onChangeText={v => setForm(p => ({ ...p, fecha_vencimiento: v }))}
                                    placeholder="2026-07-01"
                                    placeholderTextColor={Colors.muted}
                                />
                            </View>

                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.btnGhost} onPress={() => setModal(false)}>
                                    <Text style={styles.btnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={guardarCuota}>
                                    <Text style={styles.btnPrimaryText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} onHide={ocultar} />
                </Modal>
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
  header: {flexDirection: 'column',justifyContent: 'center',paddingHorizontal: 16,paddingTop: 20,paddingBottom: 16,width: '100%',backgroundColor: Colors.black},
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text, fontFamily: 'Inter_700Bold' },
  subtitulo: { fontSize: 12, color: Colors.muted, marginTop: 2, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, color: Colors.muted, marginTop: 4, fontFamily: 'Inter_400Regular' },
  filtrosRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.dark, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.black },
  filtroBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filtroText: { fontSize: 12, color: Colors.muted },
  filtroTextActive: { color: Colors.black, fontWeight: '700' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12, fontFamily: 'Inter_600SemiBold' },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13 },
  cuotaCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  cuotaTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent2, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  usuarioNombre: { fontSize: 14, fontWeight: '600', color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  cuotaMeta: { fontSize: 11, color: Colors.muted, marginTop: 2, fontFamily: 'Inter_400Regular' },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  cuotaAcciones: { flexDirection: 'row', gap: 8 },
  btnPagar: { backgroundColor: 'rgba(255, 232, 22, 0.36)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(255, 232, 22, 0.36)', alignSelf: 'flex-start' },  
  btnPagarText: { color: Colors.black, fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  btnEditar: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', alignItems: 'center', paddingHorizontal: 16 },
  btnEditarText: { color: Colors.blue, fontSize: 12 , fontFamily: 'Inter_600SemiBold'},
  btnEliminar: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  btnEliminarText: { color: Colors.red, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sinCuotaCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  btnAsignar: { backgroundColor: 'rgba(200,241,53,0.12)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(200,241,53,0.3)' },
  btnAsignarText: { color: Colors.accent, fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16, fontFamily: 'Inter_600SemiBold' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500', fontFamily: 'Inter_400Regular' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14, fontFamily: 'Inter_400Regular' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14, fontFamily: 'Inter_700Bold' },
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14, fontFamily: 'Inter_400Regular' },
});