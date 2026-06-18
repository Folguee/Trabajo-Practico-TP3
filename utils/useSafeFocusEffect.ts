/**
 * Hook que ejecuta un callback cuando la pantalla se monta (y limpia al desmontar).
 *
 * Contexto: originalmente esto envolvía `useFocusEffect` de
 * expo-router / @react-navigation/native para recargar datos al volver a enfocar
 * una pantalla. Sin embargo, en este proyecto existen DOS copias resueltas de
 * `@react-navigation/native` en node_modules (pnpm), por lo que el
 * `NavigationContext` / `NavigationStateContext` importado podía ser una
 * instancia DISTINTA a la que provee Expo Router. Al leer ese contexto "huérfano"
 * se accede a sus getters por defecto, que lanzan:
 *   "Couldn't find a navigation context. Have you wrapped your app with
 *    'NavigationContainer'?"
 *
 * Solución: no dependemos de ningún contexto de navegación. Usamos `useEffect`
 * puro. En Expo Router, navegar entre tabs con `router.push` desmonta/monta las
 * pantallas, por lo que el efecto vuelve a ejecutarse al regresar a la pantalla,
 * logrando el mismo objetivo (recargar datos) sin tocar el contexto de navegación.
 */
import { useEffect, useRef } from 'react';

export function useSafeFocusEffect(callback: () => void | (() => void)) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let cleanup: void | (() => void);
    try {
      cleanup = callbackRef.current();
    } catch {
      cleanup = undefined;
    }

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
    // Solo al montar/desmontar: queremos ejecutar una vez al entrar a la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}