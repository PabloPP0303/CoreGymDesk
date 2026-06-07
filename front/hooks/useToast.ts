import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'info' as 'success' | 'error' | 'warning' | 'info' });

  function mostrar(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    setToast({ visible: true, mensaje, tipo });
  }

  function ocultar() {
    setToast(prev => ({ ...prev, visible: false }));
  }

  return { toast, mostrar, ocultar };
}