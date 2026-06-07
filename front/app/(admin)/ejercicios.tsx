import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, Image
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';
import { Confirmar } from '../../notificaciones/Confirmacion';
import { useConfirmar } from '../../hooks/useConfirmar';


const supabase = createClient(
  'https://fcwmxzmowmnoknjrfvfo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjd214em1vd21ub2tuanJmdmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjYzNjUsImV4cCI6MjA5NTkwMjM2NX0.l4PRv8LfRx2R87WhwbIl5yE-StktrS0_Ag-96xa4G0Y'
);

const GRUPOS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos', 'Gemelos', 'Global'];

const formVacio = {
  nombre: '',
  descripcion: '',
  grupo_muscular: 'Pecho',
  imagen_url: '',
};

export default function AdminEjerciciosScreen() {
  const { token } = useAuth();
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState(formVacio);
  const [pagina, setPagina] = useState(1);
  const ITEMS_POR_PAGINA = 10;
  const { toast, mostrar, ocultar } = useToast();
  const { confirmar, pedir, cerrar } = useConfirmar();

  useFocusEffect(
    useCallback(() => {
      cargarEjercicios();
    }, [])
  );

  async function cargarEjercicios() {
    try {
      const res = await axios.get(`${API_URL}/ejercicios`);
      setEjercicios(res.data);
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

  function abrirEditar(ejercicio: any) {
    setEditando(ejercicio);
    setForm({
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion || '',
      grupo_muscular: ejercicio.grupo_muscular,
      imagen_url: ejercicio.imagen_url || '',
    });
    setModal(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) {
        mostrar('El nombre es obligatorio', 'error');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editando) {
        await axios.put(`${API_URL}/ejercicios?id=${editando.id}`, form, { headers });
      } else {
        await axios.post(`${API_URL}/ejercicios`, form, { headers });
      }
      setModal(false);
      cargarEjercicios();
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al guardar ejercicio', 'error');
    }
  }

  async function eliminar(id: number, nombre: string) {
    pedir(`¿Eliminar "${nombre}"?`, 'Esta acción no se puede deshacer.', async () => {
      try {
        await axios.delete(`${API_URL}/ejercicios?id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        cargarEjercicios();
      } catch (e: any) {
        mostrar(e.response?.data?.error || 'Error al eliminar', 'error');
      }
    }, true);
  }

  async function subirImagen() {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const fileName = `ejercicio_${Date.now()}.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
        .from('ejercicios')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (error) {
        mostrar('Error al subir imagen', 'error');
        return;
    }

    const { data: urlData } = supabase.storage
        .from('ejercicios')
        .getPublicUrl(fileName);

    setForm(p => ({ ...p, imagen_url: urlData.publicUrl }));
    mostrar('Imagen subida correctamente', 'success');
}

  const grupos = ['Todos', ...GRUPOS];

  const ejerciciosFiltrados = ejercicios.filter(e => {
    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideGrupo = filtroGrupo === 'Todos' || e.grupo_muscular === filtroGrupo;
    return coincideBusqueda && coincideGrupo;
  });

    const ejerciciosPaginados = ejerciciosFiltrados.slice(
        (pagina - 1) * ITEMS_POR_PAGINA,
        pagina * ITEMS_POR_PAGINA
    );
    const totalPaginas = Math.ceil(ejerciciosFiltrados.length / ITEMS_POR_PAGINA);

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeftSimple}>
                        <Text style={styles.titulo}>Ejercicios</Text>
                        <Text style={styles.subtitulo}>{ejercicios.length} ejercicios en el banco</Text>
                    </View>
                    <View style={styles.headerRightSimple}>
                        <TouchableOpacity style={styles.btnPrimary} onPress={abrirCrear}>
                            <Text style={styles.btnPrimaryText}>+ Nuevo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.searchWrap}>
                    <TextInput
                        style={styles.searchInput}
                        value={busqueda}
                        onChangeText={v => { setBusqueda(v); setPagina(1) }}
                        placeholder="Buscar ejercicio..."
                        placeholderTextColor={Colors.muted}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosRow}>
                    {grupos.map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.filtroBadge, filtroGrupo === g && styles.filtroBadgeActive]}
                            onPress={() => { setFiltroGrupo(g); setPagina(1) }}
                        >
                            <Text style={[styles.filtroText, filtroGrupo === g && styles.filtroTextActive]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.section}>
                    {ejerciciosFiltrados.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
                        </View>
                    ) : (
                        ejerciciosPaginados.map((e: any) => (
                            <View key={e.id} style={styles.ejercicioCard}>
                                {e.imagen_url ? (
                                    <Image
                                        source={{ uri: e.imagen_url }}
                                        style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }}
                                        resizeMode="cover"
                                    />
                                ) : null}
                                <View style={styles.ejercicioInfo}>
                                    <Text style={styles.ejercicioNombre}>{e.nombre}</Text>
                                    <View style={styles.grupoBadge}>
                                        <Text style={styles.grupoText}>{e.grupo_muscular}</Text>
                                    </View>
                                    {e.descripcion ? <Text style={styles.ejercicioDesc}>{e.descripcion}</Text> : null}
                                </View>
                                <View style={styles.acciones}>
                                    <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEditar(e)}>
                                        <Text style={styles.btnEditarText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminar(e.id, e.nombre)}>
                                        <Text style={styles.btnEliminarText}>Borrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                    {totalPaginas > 1 && (
                        <View style={styles.paginacionContainer}>
                            <TouchableOpacity
                                style={[styles.btnPaginacion, { opacity: pagina === 1 ? 0.4 : 1 }]}
                                onPress={() => setPagina(p => p - 1)}
                                disabled={pagina === 1}
                            >
                                <Text style={styles.btnGhostText}><Ionicons name="arrow-back" size={16} /> Anterior</Text>
                            </TouchableOpacity>

                            <Text style={styles.paginacionTexto}>{pagina} / {totalPaginas}</Text>

                            <TouchableOpacity
                                style={[styles.btnPaginacion, { opacity: pagina === totalPaginas ? 0.4 : 1 }]}
                                onPress={() => setPagina(p => p + 1)}
                                disabled={pagina === totalPaginas}
                            >
                                <Text style={styles.btnGhostText}>Siguiente <Ionicons name="arrow-forward" size={16} /></Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <Modal visible={modal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalTitulo}>
                                {editando ? 'Editar ejercicio' : 'Nuevo ejercicio'}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.nombre}
                                    onChangeText={v => setForm(p => ({ ...p, nombre: v }))}
                                    placeholder="Press de banca..."
                                    placeholderTextColor={Colors.muted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Grupo muscular</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {GRUPOS.map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.filtroBadge, form.grupo_muscular === g && styles.filtroBadgeActive]}
                                                onPress={() => setForm(p => ({ ...p, grupo_muscular: g }))}
                                            >
                                                <Text style={[styles.filtroText, form.grupo_muscular === g && styles.filtroTextActive]}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Descripción</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    value={form.descripcion}
                                    onChangeText={v => setForm(p => ({ ...p, descripcion: v }))}
                                    placeholder="Descripción del ejercicio..."
                                    placeholderTextColor={Colors.muted}
                                    multiline
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Imagen</Text>
                                {form.imagen_url ? (
                                    <Image
                                        source={{ uri: form.imagen_url }}
                                        style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 8 }}
                                        resizeMode="cover"
                                    />
                                ) : null}
                                <TouchableOpacity style={styles.btnGhost} onPress={subirImagen}>
                                    <Text style={styles.btnGhostText}>
                                        {form.imagen_url ? 'Cambiar imagen' : 'Seleccionar imagen'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.btnGhost} onPress={() => setModal(false)}>
                                    <Text style={styles.btnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={guardar}>
                                    <Text style={styles.btnPrimaryText}>{editando ? 'Guardar cambios' : 'Crear ejercicio'}</Text>
                                </TouchableOpacity>
                            </View>
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
  header: {flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',paddingHorizontal: 16,paddingVertical: 14,width: '100%',backgroundColor: Colors.black},
  headerLeftSimple: {flexDirection: 'column'},
  headerRightSimple: {justifyContent: 'center',alignItems: 'flex-end'},  titulo: {fontSize: 24,fontWeight: 'bold',color: Colors.text},
  subtitulo: {fontSize: 14,color: Colors.muted},
  searchWrap: { padding: 16, paddingBottom: 8, backgroundColor: Colors.black },
  searchInput: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, color: Colors.text, fontSize: 14 },
  filtrosRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filtroBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filtroText: { fontSize: 12, color: Colors.muted },
  filtroTextActive: { color: Colors.black, fontWeight: '700' },
  section: { padding: 16 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13 },
  ejercicioCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ejercicioInfo: { flex: 1, marginRight: 10 },
  ejercicioNombre: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  grupoBadge: { backgroundColor: 'rgba(200,241,53,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(200,241,53,0.25)', alignSelf: 'flex-start', marginBottom: 4 },
  grupoText: { fontSize: 11, color: Colors.accent, fontWeight: '500' },
  ejercicioDesc: { fontSize: 11, color: Colors.muted, lineHeight: 16 },
  acciones: { gap: 6 },
  btnEditar: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', alignItems: 'center' },
  btnEditarText: { color: Colors.blue, fontSize: 12 },
  btnEliminar: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  btnEliminarText: { color: Colors.red, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '85%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  btnPrimary: {backgroundColor: Colors.accent,paddingHorizontal: 16,paddingVertical: 10,borderRadius: 8},
  btnPrimaryText: { color: Colors.black,fontWeight: 'bold'},
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14 },
  paginacionContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, width: '100%' },
  btnPaginacion: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  paginacionTexto: { color: Colors.muted, fontSize: 14, fontWeight: '500', marginHorizontal: 12 },
});