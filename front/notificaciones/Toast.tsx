import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  mensaje: string;
  tipo?: ToastType;
  onHide: () => void;
}

export function Toast({ visible, mensaje, tipo = 'info', onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start(() => onHide());
    }
  }, [visible]);

  const config = {
    success: { color: Colors.green, icon: 'checkmark-circle-outline' as const, bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
    error: { color: Colors.red, icon: 'close-circle-outline' as const, bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
    warning: { color: Colors.orange, icon: 'warning-outline' as const, bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)' },
    info: { color: Colors.accent, icon: 'information-circle-outline' as const, bg: 'rgba(230,234,8,0.15)', border: 'rgba(230,234,8,0.3)' },
  };

  const c = config[tipo];

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: c.bg, borderColor: c.border }]}>
      <Ionicons name={c.icon} size={20} color={c.color} />
      <Text style={[styles.texto, { color: c.color }]}>{mensaje}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute',alignSelf: 'center', bottom: 100, maxWidth: 370, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, zIndex: 99999, elevation: 99999 },
  texto: { fontSize: 13, fontWeight: '500', flex: 1 },
});