import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface ConfirmarProps {
  visible: boolean;
  titulo: string;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  textoConfirmar?: string;
  peligroso?: boolean;
}

export function Confirmar({ visible, titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = 'Confirmar', peligroso = false }: ConfirmarProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}>{mensaje}</Text>
          <View style={styles.btns}>
            <TouchableOpacity style={styles.btnCancelar} onPress={onCancelar}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnConfirmar, peligroso && styles.btnPeligroso]} 
              onPress={onConfirmar}
            >
              <Text style={styles.btnConfirmarText}>{textoConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border, width: '100%', maxWidth: 400 },
  titulo: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  mensaje: { fontSize: 14, color: Colors.muted, marginBottom: 20 },
  btns: { flexDirection: 'row', gap: 10 },
  btnCancelar: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnCancelarText: { color: Colors.text, fontSize: 14 },
  btnConfirmar: { flex: 1, backgroundColor: Colors.accent, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnConfirmarText: { color: Colors.red, fontWeight: '700', fontSize: 14 },
  btnPeligroso: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
});