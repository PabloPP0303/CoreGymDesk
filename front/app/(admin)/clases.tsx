import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';
import { Confirmar } from '../../notificaciones/Confirmacion';
import { useConfirmar } from '../../hooks/useConfirmar';



const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const formVacio = {
  nombre: '',
  descripcion: '',
  sala: '',
  hora_inicio: '',
  hora_fin: '',
  dias: [] as string[],
  aforo_maximo: '15',
};

export default function AdminClasesScreen() {
  const { token } = useAuth();
  const [clases, setClases] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState(formVacio);
  const { toast, mostrar, ocultar } = useToast();
  const { confirmar, pedir, cerrar } = useConfirmar();



  useEffect(() => {
    cargarClases();
  }, []);

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

  function abrirCrear() {
    setEditando(null);
    setForm(formVacio);
    setModal(true);
  }

  function abrirEditar(clase: any) {
    setEditando(clase);
    setForm({
      nombre: clase.nombre,
      descripcion: clase.descripcion || '',
      sala: clase.sala,
      hora_inicio: clase.hora_inicio,
      hora_fin: clase.hora_fin,
      dias: clase.dias || [],
      aforo_maximo: String(clase.aforo_maximo),
    });
    setModal(true);
  }

  function toggleDia(dia: string) {
    setForm(prev => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter(d => d !== dia)
        : [...prev.dias, dia],
    }));
  }

    async function guardar() {
        if (form.dias.length === 0) {
            mostrar('Selecciona al menos un día para la clase', 'error');
            return;
        }

        if (!form.nombre || !form.sala || !form.hora_inicio || !form.hora_fin) {
            mostrar('Rellena todos los campos obligatorios', 'error');
            return;
        }

        if (parseInt(form.aforo_maximo) > 30) {
            mostrar('El aforo máximo no puede ser superior a 30', 'error');
            return;
        }

        const horaInicio = parseInt(form.hora_inicio.split(':')[0]);
        const horaFin = parseInt(form.hora_fin.split(':')[0]);

        if (horaInicio < 6 || horaInicio > 23 || horaFin < 6 || horaFin > 23) {
            mostrar('Elige un horario entre las 6:00 y las 23:00', 'error');
            return;
        }

        if (horaInicio >= horaFin) {
            mostrar('La hora de inicio debe ser anterior a la hora de fin', 'error');
            return;
        }

        try {
            const body = {
                ...form,
                aforo_maximo: parseInt(form.aforo_maximo),
            };
            const headers = { Authorization: `Bearer ${token}` };

            if (editando) {
                await axios.put(`${API_URL}/clases/${editando.id}`, body, { headers });
            } else {
                await axios.post(`${API_URL}/clases`, body, { headers });
            }

            setModal(false);
            cargarClases();
        } catch (e: any) {
            const mensaje = e.response?.data?.error || '';
            if (mensaje.includes('invalid input syntax for type time')) {
                mostrar('Introduce la hora en formato HH:MM', 'error');
            } else {
                mostrar(mensaje || 'Error al guardar la clase', 'error');
            }
        }
    }

    async function eliminar(id: number) {
        pedir(
            'Eliminar clase',
            '¿Estás seguro de que quieres eliminar esta clase?',
            async () => {
                try {
                    await axios.delete(`${API_URL}/clases/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    mostrar('Clase eliminada correctamente', 'success');
                    cargarClases();
                } catch (e: any) {
                    mostrar(e.response?.data?.error || 'Error al eliminar', 'error');
                }
            },
            true,
            'Eliminar'
        );
    }

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.headerSimple}>
                    <View style={styles.headerLeftSimple}>
                        <Text style={styles.titulo}>Clases</Text>
                        <Text style={styles.subtitulo}>{clases.length} clases activas</Text>
                    </View>
                    <View style={styles.headerRightSimple}>
                        <TouchableOpacity style={styles.btnPrimary} onPress={abrirCrear}>
                            <Text style={styles.btnPrimaryText}>+ Nueva</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    {clases.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No hay clases creadas</Text>
                        </View>
                    ) : (
                        clases.map((clase: any) => (
                            <View key={clase.id} style={styles.claseCard}>
                                <View style={styles.claseInfo}>
                                    <Text style={styles.claseNombre}>{clase.nombre}</Text>
                                    <Text style={styles.claseMeta}>{clase.sala} · {clase.hora_inicio} – {clase.hora_fin}</Text>
                                    <Text style={styles.claseMeta}>Aforo: {clase.aforo_maximo} plazas</Text>
                                    {clase.dias && clase.dias.length > 0 && (
                                        <Text style={styles.claseDias}>{clase.dias.join(', ')}</Text>
                                    )}
                                </View>
                                <View style={styles.claseAcciones}>
                                    <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEditar(clase)}>
                                        <Text style={styles.btnEditarText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminar(clase.id)}>
                                        <Text style={styles.btnEliminarText}>Borrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <Modal visible={modal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalTitulo}>
                                {editando ? 'Editar clase' : 'Nueva clase'}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre *</Text>
                                <TextInput style={styles.input} value={form.nombre} onChangeText={v => setForm(p => ({ ...p, nombre: v }))} placeholder="CrossFit Matutino" placeholderTextColor={Colors.muted} />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Sala *</Text>
                                <TextInput style={styles.input} value={form.sala} onChangeText={v => setForm(p => ({ ...p, sala: v }))} placeholder="Sala A" placeholderTextColor={Colors.muted} />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Descripción</Text>
                                <TextInput style={[styles.input, { height: 70 }]} value={form.descripcion} onChangeText={v => setForm(p => ({ ...p, descripcion: v }))} placeholder="Descripción de la clase..." placeholderTextColor={Colors.muted} multiline />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Hora inicio *</Text>
                                    <TextInput style={styles.input} value={form.hora_inicio} onChangeText={v => setForm(p => ({ ...p, hora_inicio: v }))} placeholder="18:00" placeholderTextColor={Colors.muted} />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Hora fin *</Text>
                                    <TextInput style={styles.input} value={form.hora_fin} onChangeText={v => setForm(p => ({ ...p, hora_fin: v }))} placeholder="19:00" placeholderTextColor={Colors.muted} />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Aforo máximo (máx. 30)</Text>
                                <TextInput style={styles.input} value={form.aforo_maximo} onChangeText={v => setForm(p => ({ ...p, aforo_maximo: v }))} keyboardType="numeric" placeholderTextColor={Colors.muted} />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Días</Text>
                                <View style={styles.diasRow}>
                                    {DIAS_SEMANA.map((dia, i) => (
                                        <TouchableOpacity
                                            key={dia}
                                            style={[styles.diaBadge, form.dias.includes(dia) && styles.diaBadgeActive]}
                                            onPress={() => toggleDia(dia)}
                                        >
                                            <Text style={[styles.diaText, form.dias.includes(dia) && styles.diaTextActive]}>
                                                {DIAS_LABEL[i]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.btnGhost} onPress={() => setModal(false)}>
                                    <Text style={styles.btnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={guardar}>
                                    <Text style={styles.btnPrimaryText}>{editando ? 'Guardar cambios' : 'Crear clase'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
  headerSimple: {flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center', paddingHorizontal: 16,paddingVertical: 14,width: '100%', backgroundColor: Colors.black},
  headerLeftSimple: {flexDirection: 'column'},
  headerRightSimple: {justifyContent: 'center',alignItems: 'flex-end'},
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  section: { padding: 16 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13 },
  claseCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claseInfo: { flex: 1 },
  claseNombre: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  claseMeta: { fontSize: 12, color: Colors.muted, marginBottom: 1 },
  claseDias: { fontSize: 11, color: Colors.accent, marginTop: 4 },
  claseAcciones: { gap: 6 },
  btnEditar: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', alignItems: 'center' },
  btnEditarText: { color: Colors.blue, fontSize: 12 },
  btnEliminar: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  btnEliminarText: { color: Colors.red, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14 },
  row: { flexDirection: 'row' },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  diaBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  diaText: { fontSize: 12, color: Colors.muted },
  diaTextActive: { color: Colors.black, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  btnPrimary: {backgroundColor: Colors.accent,paddingHorizontal: 16,paddingVertical: 10,borderRadius: 8, flex: 1},
  btnPrimaryText: {color: Colors.black,fontWeight: 'bold', textAlign: 'center'},
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14 }
});