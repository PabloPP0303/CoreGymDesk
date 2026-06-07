import { useState } from 'react';

export function useConfirmar() {
  const [confirmar, setConfirmar] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    onConfirmar: () => {},
    peligroso: false,
    textoConfirmar: 'Confirmar',
  });

  function pedir(titulo: string, mensaje: string, onConfirmar: () => void, peligroso = true, textoConfirmar = 'Confirmar') {
    setConfirmar({ visible: true, titulo, mensaje, onConfirmar, peligroso, textoConfirmar });
  }

  function cerrar() {
    setConfirmar(prev => ({ ...prev, visible: false }));
  }

  return { confirmar, pedir, cerrar };
}