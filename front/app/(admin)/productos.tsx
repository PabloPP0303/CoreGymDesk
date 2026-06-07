import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, Image
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIAS = ['Ropa', 'Accesorios', 'Nutrición'];

const formVacio = {
  nombre: '',
  descripcion: '',
  categoria: 'Ropa',
  precio: '',
  stock: '',
  imagen_url: '',
};



export default function AdminProductosScreen() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState(formVacio);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [verPedidos, setVerPedidos] = useState(false);
  const { toast, mostrar, ocultar } = useToast();

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [])
  );

    async function cargarProductos() {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [resProductos, resPedidos] = await Promise.all([
                axios.get(`${API_URL}/productos`),
                axios.get(`${API_URL}/pedidos`, { headers }),
            ]);
            setProductos(resProductos.data);
            setPedidos(resPedidos.data);
        } catch (e) {
            console.error(e);
        } finally {
            setCargando(false);
        }
    }

    async function marcarPagado(id: number) {
        try {
            await axios.put(
                `${API_URL}/pedidos?id=${id}`,
                { estado: 'completado' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            cargarProductos();
        } catch (e: any) {
            mostrar(e.response?.data?.error || 'Error al actualizar pedido', 'error');
        }
    }

  function abrirCrear() {
    setEditando(null);
    setForm(formVacio);
    setModal(true);
  }

  function abrirEditar(producto: any) {
    setEditando(producto);
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria,
      precio: String(producto.precio),
      stock: String(producto.stock),
      imagen_url: producto.imagen_url || '',
    });
    setModal(true);
  }

  async function subirImagen() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const fileName = `producto_${Date.now()}.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('productos')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (error) {
      mostrar('Error al subir imagen', 'error');
      return;
    }

    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName);
    setForm(p => ({ ...p, imagen_url: urlData.publicUrl }));
    mostrar('Imagen subida correctamente', 'success');
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.precio || !form.stock) {
      mostrar('Nombre, precio y stock son obligatorios', 'error');
      return;
    }
    try {
      const body = {
        ...form,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock),
      };
      const headers = { Authorization: `Bearer ${token}` };

      if (editando) {
        await axios.put(`${API_URL}/productos?id=${editando.id}`, body, { headers });
      } else {
        await axios.post(`${API_URL}/productos`, body, { headers });
      }

      setModal(false);
      cargarProductos();
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al guardar producto', 'error');
    }
  }

  async function eliminar(id: number, nombre: string) {
    const confirmar = window.confirm(`¿Eliminar "${nombre}"?`);
    if (!confirmar) return;
    try {
      await axios.delete(`${API_URL}/productos?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarProductos();
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al eliminar', 'error');
    }
  }

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.titulo}>{verPedidos ? 'Pedidos' : 'Productos'}</Text>
                        <Text style={styles.subtitulo}>
                            {verPedidos
                                ? `${pedidos.filter(p => p.estado === 'pendiente').length} pedidos pendientes`
                                : `${productos.length} productos en catálogo`}
                        </Text>
                    </View>

                    <View style={styles.headerCenter}>
                        {!verPedidos && (
                            <TouchableOpacity style={styles.btnPrimary} onPress={abrirCrear}>
                                <Text style={styles.btnPrimaryText}>+ Nuevo Producto</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.btnGhost}
                            onPress={() => setVerPedidos(!verPedidos)}
                        >
                            <Text style={styles.btnGhostText}>
                                {verPedidos ? 'Ver productos' : `Pedidos (${pedidos.filter(p => p.estado === 'pendiente').length})`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {verPedidos ? (
                    <View style={styles.section}>
                        {pedidos.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No hay pedidos</Text>
                            </View>
                        ) : (
                            pedidos.map((p: any) => (
                                <View key={p.id} style={styles.pedidoCard}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.productoNombre}>{p.productos?.nombre}</Text>
                                        <Text style={styles.productoMeta}>
                                            {p.perfiles?.nombre} {p.perfiles?.apellidos} · {p.cantidad} ud · {p.productos?.precio}€
                                        </Text>
                                        <Text style={styles.productoMeta}>
                                            {new Date(p.created_at).toLocaleDateString('es-ES')}
                                        </Text>
                                    </View>
                                    <View style={{ gap: 6, alignItems: 'flex-end' }}>
                                        <View style={[styles.stockBadge, p.estado === 'pendiente' && styles.stockBadgeRed]}>
                                            <Text style={[styles.stockText, p.estado === 'pendiente' && styles.stockTextRed]}>
                                                {p.estado}
                                            </Text>
                                        </View>
                                        {p.estado === 'pendiente' && (
                                            <TouchableOpacity style={styles.btnEditar} onPress={() => marcarPagado(p.id)}>
                                                <Text style={styles.btnEditarText}>Marcar pagado</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                ) : (
                    <View style={styles.section}>
                        {productos.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No hay productos creados</Text>
                            </View>
                        ) : (
                            productos.map((p: any) => (
                                <View key={p.id} style={styles.productoCard}>
                                    {p.imagen_url ? (
                                        <Image source={{ uri: p.imagen_url }} style={styles.productoImg} resizeMode="cover" />
                                    ) : (
                                        <View style={[styles.productoImg, styles.productoImgPlaceholder]}>
                                            <Ionicons name="shirt-outline" size={24} color={Colors.accent} />
                                        </View>
                                    )}
                                    <View style={styles.productoInfo}>
                                        <Text style={styles.productoNombre}>{p.nombre}</Text>
                                        <Text style={styles.productoMeta}>{p.categoria} · {p.precio}€</Text>
                                        <View style={[styles.stockBadge, p.stock <= 0 && styles.stockBadgeRed]}>
                                            <Text style={[styles.stockText, p.stock <= 0 && styles.stockTextRed]}>
                                                Stock: {p.stock}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.acciones}>
                                        <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEditar(p)}>
                                            <Text style={styles.btnEditarText}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.btnEliminar} onPress={() => eliminar(p.id, p.nombre)}>
                                            <Text style={styles.btnEliminarText}>Borrar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                <Modal visible={modal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalTitulo}>
                                {editando ? 'Editar producto' : 'Nuevo producto'}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nombre *</Text>
                                <TextInput style={styles.input} value={form.nombre} onChangeText={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Camiseta Combo..." placeholderTextColor={Colors.muted} />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Categoría</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {CATEGORIAS.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.catBadge, form.categoria === cat && styles.catBadgeActive]}
                                            onPress={() => setForm(p => ({ ...p, categoria: cat }))}
                                        >
                                            <Text style={[styles.catText, form.categoria === cat && styles.catTextActive]}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Descripción</Text>
                                <TextInput style={[styles.input, { height: 70 }]} value={form.descripcion} onChangeText={v => setForm(p => ({ ...p, descripcion: v }))} placeholder="Descripción del producto..." placeholderTextColor={Colors.muted} multiline />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Precio (€) *</Text>
                                    <TextInput style={styles.input} value={form.precio} onChangeText={v => setForm(p => ({ ...p, precio: v }))} keyboardType="numeric" placeholder="19.99" placeholderTextColor={Colors.muted} />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Stock *</Text>
                                    <TextInput style={styles.input} value={form.stock} onChangeText={v => setForm(p => ({ ...p, stock: v }))} keyboardType="numeric" placeholder="10" placeholderTextColor={Colors.muted} />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Imagen</Text>
                                {form.imagen_url ? (
                                    <Image source={{ uri: form.imagen_url }} style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 8 }} resizeMode="contain" />
                                ) : null}
                                <TouchableOpacity style={styles.btnGhost} onPress={subirImagen}>
                                    <Text style={styles.btnGhostText}>{form.imagen_url ? 'Cambiar imagen' : 'Seleccionar imagen'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.btnGhost} onPress={() => setModal(false)}>
                                    <Text style={styles.btnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={guardar}>
                                    <Text style={styles.btnPrimaryText}>{editando ? 'Guardar cambios' : 'Crear producto'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            </ScrollView>
            <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} onHide={ocultar} />
        </>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark},
  header: {flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',paddingHorizontal: 16,paddingTop: Platform.OS === 'web' ? 16 : 56,paddingBottom: 16,backgroundColor: Colors.black,borderBottomWidth: 1, 
  borderBottomColor: Colors.border },
  headerLeft: {justifyContent: 'center'},
  headerCenter: {position: 'absolute',left: 0,right: 0,alignItems: 'center',justifyContent: 'center',zIndex: -1},
  headerRight: {justifyContent: 'center',alignItems: 'flex-end'},
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitulo: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  section: { padding: 16 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.muted, fontSize: 13 },
  pedidoCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  productoCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  productoImg: { width: 60, height: 60, borderRadius: 8 },
  productoImgPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  productoInfo: { flex: 1 },
  productoNombre: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productoMeta: { fontSize: 12, color: Colors.muted, marginBottom: 6 },
  stockBadge: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', alignSelf: 'flex-start' },
  stockBadgeRed: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  stockText: { fontSize: 11, color: Colors.green, fontWeight: '500' },
  stockTextRed: { color: Colors.red },
  acciones: { gap: 6 },
  btnEditar: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', alignItems: 'center' },
  btnEditarText: { color: Colors.blue, fontSize: 12 },
  btnEliminar: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', alignItems: 'center' },
  btnEliminarText: { color: Colors.red, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: Colors.muted, marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: Colors.dark, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 14 },
  row: { flexDirection: 'row' },
  catBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  catBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catText: { fontSize: 12, color: Colors.muted },
  catTextActive: { color: Colors.black, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14 },
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14 },
});