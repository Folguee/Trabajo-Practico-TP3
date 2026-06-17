import { Alert } from 'react-native';

/**
 * Muestra un diálogo de confirmación multiplataforma.
 * En web usa `window.confirm`; en mobile usa `Alert.alert`.
 *
 * @returns `true` si el usuario confirma, `false` si cancela.
 */
export async function confirmAction(
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }
): Promise<boolean> {
  const {
    title = 'Confirmar',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    destructive = false,
  } = options ?? {};

  const isWeb = typeof window !== 'undefined' && typeof window.confirm === 'function';

  if (isWeb) {
    return window.confirm(message);
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false }
    );
  });
}

/**
 * Confirmación específica para eliminar un movimiento.
 */
export function confirmDeleteTransaction(): Promise<boolean> {
  return confirmAction(
    '¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.',
    {
      title: 'Eliminar movimiento',
      confirmText: 'Eliminar',
      destructive: true,
    }
  );
}