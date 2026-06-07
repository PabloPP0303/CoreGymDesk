import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '@/hooks/useToast';
import { Confirmar } from '../../notificaciones/Confirmacion';
import { useConfirmar } from '../../hooks/useConfirmar';

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
  const [modalRutinas, setModalRutinas] = useState(false);
  const [rutinasUsuario, setRutinasUsuario] = useState<any[]>([]);
  const [usuarioVerRutinas, setUsuarioVerRutinas] = useState<any>(null);
  const { toast, mostrar, ocultar } = useToast();
  const { confirmar, pedir, cerrar } = useConfirmar();
  
  const [modalEjercicios, setModalEjercicios] = useState(false);
  const [rutinaCreada, setRutinaCreada] = useState<any>(null);
  const [ejercicioForm, setEjercicioForm] = useState({
        ejercicio_id: '',
        dia: 'lunes',
        series: '3',
        repeticiones: '10',
    });

  const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const DIAS_LABEL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
    pedir(`¿Eliminar al usuario ${nombre}?`, 'Esta acción no se puede deshacer.', async () => {
      try {
        await axios.delete(`${API_URL}/usuarios?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        mostrar('Usuario eliminado correctamente', 'success');
        cargarDatos();
      } catch (e: any) {
        mostrar(e.response?.data?.error || 'Error al eliminar usuario', 'error');
      }
    }, true);
  }

    async function cambiarRol(id: string, rolActual: string) {
        const nuevoRol = rolActual === 'admin' ? 'cliente' : 'admin';
        pedir(`¿Cambiar rol a ${nuevoRol}?`, `El usuario pasará a ser ${nuevoRol}.`, async () => {
            try {
                await axios.put(`${API_URL}/usuarios?id=${id}`, { rol: nuevoRol }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                cargarDatos();
            } catch (e: any) {
                mostrar(e.response?.data?.error || 'Error al cambiar rol', 'error');
            }
        }, true);
    }

  async function asignarRutina() {
    if (!nombreRutina.trim()) {
        mostrar('Escribe un nombre para la rutina', 'error');
        return;
    }
    try {
        const res = await axios.post(
        `${API_URL}/rutinas`,
        { nombre: nombreRutina, usuario_id: usuarioSeleccionado.id, ejercicios: [] },
        { headers: { Authorization: `Bearer ${token}` } }
        );
        setRutinaCreada(res.data);
        setModalRutina(false);
        setNombreRutina('');
        setModalEjercicios(true);
    } catch (e: any) {
        mostrar(e.response?.data?.error || 'Error al asignar rutina', 'error');
    }
  }
    async function verRutinas(usuario: any) {
        try {
            const res = await axios.get(`${API_URL}/rutinas?usuario_id=${usuario.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRutinasUsuario(res.data);
            setUsuarioVerRutinas(usuario);
            setModalRutinas(true);
        } catch (e) {
            mostrar('Error al cargar rutinas', 'error');
        }
    }
    async function eliminarRutinaUsuario(id: number) {
        pedir(`¿Eliminar esta rutina?`, 'Esta acción no se puede deshacer.', async () => {
        if (!confirmar) return;
        try {
            await axios.delete(`${API_URL}/rutinas?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            verRutinas(usuarioVerRutinas);
        } catch (e: any) {
            mostrar(e.response?.data?.error || 'Error al eliminar', 'error');
        }
        }, true);
    }

    async function eliminarEjercicioDeRutina(id: number, rutina: any) {
        try {
            await axios.delete(`${API_URL}/rutinas/ejercicio?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            verRutinas(usuarioVerRutinas);
        } catch (e: any) {
            mostrar('Error al eliminar ejercicio', 'error');
        }
    }

  async function añadirEjercicioAdmin() {
    if (!ejercicioForm.ejercicio_id) {
        mostrar('Selecciona un ejercicio', 'error');
        return;
    }
    try {
        await axios.post(
        `${API_URL}/rutinas/ejercicio`,
        {
            rutina_id: rutinaCreada.id,
            ejercicio_id: parseInt(ejercicioForm.ejercicio_id),
            dia: ejercicioForm.dia,
            series: parseInt(ejercicioForm.series),
            repeticiones: parseInt(ejercicioForm.repeticiones),
        },
        { headers: { Authorization: `Bearer ${token}` } }
        );
        setEjercicioForm({ ejercicio_id: '', dia: 'lunes', series: '3', repeticiones: '10' });
        mostrar('Ejercicio añadido a la rutina', 'success');
    } catch (e: any) {
        mostrar(e.response?.data?.error || 'Error al añadir ejercicio', 'error');
    }
}

  const usuariosFiltrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.titulo}>Usuarios</Text>
                    <Text style={styles.subtitulo}>{usuarios.length} socios registrados</Text>
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
                                    <TouchableOpacity style={styles.btnAccion} onPress={() => verRutinas(u)}>
                                        <Text style={styles.btnAccionText}>Ver rutinas</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnAccion} onPress={() => cambiarRol(u.id, u.rol)}>
                                        <Text style={styles.btnAccionText}>{u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnAccion} onPress={() => router.push('/(admin)/cuotas')}>
                                        <Text style={styles.btnAccionText}>Gestionar cuota</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminarUsuario(u.id, `${u.nombre} ${u.apellidos}`)}>
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
                            <Text style={styles.modalTitulo}>Asignar rutina a {usuarioSeleccionado?.nombre}</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre de la rutina</Text>
                                <TextInput style={styles.input} value={nombreRutina} onChangeText={setNombreRutina} placeholder="Rutina de fuerza..." placeholderTextColor={Colors.muted} />
                            </View>
                            <Text style={styles.infoText}>La rutina se creará vacía. El usuario podrá añadir ejercicios desde su perfil.</Text>
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


                <Modal visible={modalEjercicios} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalTitulo}>Añadir ejercicios a "{rutinaCreada?.nombre}"</Text>
                            <Text style={styles.infoText}>Rutina de {usuarioSeleccionado?.nombre}. Puedes añadir varios ejercicios.</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ejercicio</Text>
                                <ScrollView style={styles.ejerciciosList} nestedScrollEnabled>
                                    {ejercicios.map(e => (
                                        <TouchableOpacity
                                            key={e.id}
                                            style={[styles.ejercicioOption, ejercicioForm.ejercicio_id === String(e.id) && styles.ejercicioOptionActive]}
                                            onPress={() => setEjercicioForm(p => ({ ...p, ejercicio_id: String(e.id) }))}
                                        >
                                            <Text style={[styles.ejercicioOptionText, ejercicioForm.ejercicio_id === String(e.id) && styles.ejercicioOptionTextActive]}>{e.nombre}</Text>
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
                                            <Text style={[styles.diaText, ejercicioForm.dia === dia && styles.diaTextActive]}>{DIAS_LABEL[i].slice(0, 3)}</Text>
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
                                <TouchableOpacity style={styles.btnGhost} onPress={() => { setModalEjercicios(false); verRutinas(usuarioVerRutinas); setModalRutinas(true); }}>
                                    <Text style={styles.btnGhostText}>Finalizar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={añadirEjercicioAdmin}>
                                    <Text style={styles.btnPrimaryText}>+ Añadir</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>

                {/* Modal ver rutinas */}
                <Modal visible={modalRutinas} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalTitulo}>Rutinas de {usuarioVerRutinas?.nombre}</Text>
                            {rutinasUsuario.length === 0 ? (
                                <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 16 }}>No tiene rutinas asignadas</Text>
                            ) : (
                                rutinasUsuario.map((r: any) => (
                                    <View key={r.id} style={{ backgroundColor: Colors.dark, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14 }}>{r.nombre}</Text>
                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                <TouchableOpacity onPress={() => { setRutinaCreada(r); setModalRutinas(false); setModalEjercicios(true); }}>
                                                    <Text style={{ color: Colors.accent, fontSize: 12 }}>+ Ejercicio</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => eliminarRutinaUsuario(r.id)}>
                                                    <Text style={{ color: Colors.red, fontSize: 12 }}>Eliminar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {r.rutina_ejercicios?.map((re: any) => (
                                            <View key={re.id} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, marginBottom: 3 }}>
                                                <Text style={{ color: Colors.muted, fontSize: 12 }}>{re.dia} · {re.ejercicios?.nombre}</Text>
                                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                                    <Text style={{ color: Colors.accent, fontSize: 12 }}>{re.series}×{re.repeticiones}</Text>
                                                    <TouchableOpacity onPress={() => eliminarEjercicioDeRutina(re.id, r)}>
                                                        <Text style={{ color: Colors.red, fontSize: 12 }}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ))
                            )}
                            <TouchableOpacity style={[styles.btnPrimary, { marginBottom: 8 }]} onPress={() => { setModalRutinas(false); setUsuarioSeleccionado(usuarioVerRutinas); setNombreRutina(''); setModalRutina(true); }}>
                                <Text style={styles.btnPrimaryText}>+ Añadir rutina</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnGhost} onPress={() => setModalRutinas(false)}>
                                <Text style={styles.btnGhostText}>Cerrar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
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
});