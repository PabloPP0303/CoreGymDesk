import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Image
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL, Colors } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../../notificaciones/Toast';
import { useToast } from '../../hooks/useToast';

export default function TiendaScreen() {
  const { token } = useAuth();
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('Todo');
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const { toast, mostrar, ocultar } = useToast();

  const categorias = ['Todo', 'Ropa', 'Accesorios', 'Nutrición'];

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [])
  );

  function getIconoCategoria(categoria: string) {
    switch (categoria) {
      case 'Ropa': return 'shirt-outline';
      case 'Accesorios': return 'watch-outline';
      case 'Nutrición': return 'nutrition-outline';
      default: return 'bag-handle-outline';
    }
  }

  async function cargarProductos() {
    try {
      const res = await axios.get(`${API_URL}/productos`);
      setProductos(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function hacerPedido(productoId: number) {
    try {
      await axios.post(
        `${API_URL}/pedidos`,
        { producto_id: productoId, cantidad: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrar('¡Pedido realizado! Pasa por el gimnasio para recogerlo y pagar.', 'success');
      setModalDetalle(false);
      cargarProductos();
    } catch (e: any) {
      mostrar(e.response?.data?.error || 'Error al realizar el pedido', 'error');
    }
  }

  const productosFiltrados = filtro === 'Todo'
    ? productos
    : productos.filter(p => p.categoria === filtro);

  if (cargando) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  return (
    <>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Tienda</Text>
        <Text style={styles.subtitulo}>Merchandising Gimnasio Combo</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosRow}>
        {categorias.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filtroBadge, filtro === cat && styles.filtroBadgeActive]}
            onPress={() => setFiltro(cat)}
          >
            <Text style={[styles.filtroText, filtro === cat && styles.filtroTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {productosFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
        ) : (
          productosFiltrados.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productoCard}
              onPress={() => { setProductoSeleccionado(p); setModalDetalle(true); }}
            >
              <View style={styles.productoImg}>
                {p.imagen_url ? (
                  <Image source={{ uri: p.imagen_url }} style={{ width: '100%', height: '100%', borderRadius: 10 }} resizeMode="cover" />
                ) : (
                  <Ionicons name={getIconoCategoria(p.categoria) as any}size={48} color={Colors.accent} />
                )}
              </View>
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombre} numberOfLines={1}>{p.nombre}</Text>
                <Text style={styles.productoCategoria}>{p.categoria}</Text>
                <Text style={styles.productoPrecio}>{p.precio}€</Text>
                <View style={[styles.stockBadge, p.stock <= 0 && styles.stockBadgeRed]}>
                  <Text style={[styles.stockText, p.stock <= 0 && styles.stockTextRed]}>
                    {p.stock > 0 ? `Stock: ${p.stock}` : 'Sin stock'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Modal visible={modalDetalle} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {productoSeleccionado?.imagen_url ? (
              <Image
                source={{ uri: productoSeleccionado.imagen_url }}
                style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.modalImgPlaceholder}>
                <Ionicons name="shirt-outline" size={48} color={Colors.accent} />
              </View>
            )}
            <Text style={styles.modalTitulo}>{productoSeleccionado?.nombre}</Text>
            <Text style={styles.modalCategoria}>{productoSeleccionado?.categoria}</Text>
            <Text style={styles.modalDesc}>{productoSeleccionado?.descripcion}</Text>
            <View style={styles.modalPrecioRow}>
              <Text style={styles.modalPrecio}>{productoSeleccionado?.precio}€</Text>
              <View style={[styles.stockBadge, productoSeleccionado?.stock <= 0 && styles.stockBadgeRed]}>
                <Text style={[styles.stockText, productoSeleccionado?.stock <= 0 && styles.stockTextRed]}>
                  {productoSeleccionado?.stock > 0 ? `${productoSeleccionado.stock} en stock` : 'Sin stock'}
                </Text>
              </View>
            </View>
            <View style={styles.infoBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="card-outline" size={16} color={Colors.accent} />
                <Text style={styles.infoText}>El pago se realiza en el gimnasio al recoger el pedido</Text>
              </View>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setModalDetalle(false)}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={productoSeleccionado?.stock > 0 ? styles.btnPrimary : styles.btnDisabled}
                disabled={productoSeleccionado?.stock <= 0}
                onPress={() => hacerPedido(productoSeleccionado?.id)}
              >
                <Text style={productoSeleccionado?.stock > 0 ? styles.btnPrimaryText : styles.btnDisabledText}>
                  {productoSeleccionado?.stock > 0 ? 'Hacer pedido' : 'Sin stock'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} onHide={ocultar} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark },
  header: {flexDirection: 'column',justifyContent: 'center',paddingHorizontal: 16,paddingTop: 20,paddingBottom: 16,width: '100%',backgroundColor: Colors.black},
  titulo: { fontSize: 24, fontWeight: '700', color: Colors.text, fontFamily: 'Inter_700Bold' },
  subtitulo: { fontSize: 12, color: Colors.muted, marginTop: 2, fontFamily: 'Inter_400Regular'},  
  filtrosRow: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.black, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtroBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.dark },
  filtroBadgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filtroText: { fontSize: 13, color: Colors.muted },
  filtroTextActive: { color: Colors.black, fontWeight: '700' },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyText: { color: Colors.muted, fontSize: 13 },
  productoCard: { width: '47%', backgroundColor: Colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  productoImg: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  productoEmoji: { fontSize: 40 },
  productoInfo: { padding: 12 },
  productoNombre: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2, fontFamily: 'Inter_600SemiBold' },
  productoCategoria: { fontSize: 11, color: Colors.muted, marginBottom: 6 },
  productoPrecio: { fontSize: 22, fontWeight: '700', color: Colors.accent, marginBottom: 6, fontFamily: 'Inter_700Bold' },
  stockBadge: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', alignSelf: 'flex-start' },
  stockBadgeRed: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  stockText: { fontSize: 11, color: Colors.green, fontWeight: '500' },
  stockTextRed: { color: Colors.red },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalImgPlaceholder: { height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4, fontFamily: 'Inter_600SemiBold' },
  modalCategoria: { fontSize: 12, color: Colors.muted, marginBottom: 8 },
  modalDesc: { fontSize: 13, color: Colors.text, lineHeight: 20, marginBottom: 12 },
  modalPrecioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalPrecio: { fontSize: 28, fontWeight: '700', color: Colors.accent, fontFamily: 'Inter_700Bold' },
  infoBox: { backgroundColor: 'rgba(200,241,53,0.08)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(200,241,53,0.2)', marginBottom: 16 },
  infoText: { fontSize: 12, color: Colors.accent, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  btnPrimary: { backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: Colors.black, fontWeight: '700', fontSize: 14, fontFamily: 'Inter_700Bold'},
  btnGhost: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center', flex: 1 },
  btnGhostText: { color: Colors.text, fontSize: 14, fontFamily: 'Inter_400Regular' },
  btnDisabled: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, alignItems: 'center', flex: 1, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  btnDisabledText: { color: Colors.red, fontSize: 14 },
});