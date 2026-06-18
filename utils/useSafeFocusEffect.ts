/**
 * Hook seguro que reemplaza useFocusEffect de expo-router/react-navigation.
 * 
 * Problema: useFocusEffect usa internamente useNavigation(), que lanza un
 * error si el componente se renderiza antes de que el Stack navigator haya
 * propagado su contexto (race condition en Expo Router mobile).
 * 
 * Solución: Verificamos si NavigationContext existe. Si sí, usamos
 * useFocusEffect normal. Si no, usamos useEffect como fallback seguro.
 * 
 * Para cumplir las reglas de hooks (no llamar hooks condicionalmente),
 * siempre llamamos useEffect, pero controlamos cuál ejecuta el callback.
 */
import { useCallback, useContext, useEffect, useRef } from 'react';
import { NavigationContext } from '@react-navigation/native';

export function useSafeFocusEffect(callback: () => void | (() => void)) {
  const navigation = useContext(NavigationContext);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Ruta 1: Si hay contexto de navegación, escuchamos el evento 'focus'
  useEffect(() => {
    if (!navigation) return;

    // Ejecutar inmediatamente (la pantalla ya está enfocada si estamos montados)
    const cleanup = callbackRef.current();

    const unsubFocus = navigation.addListener('focus', () => {
      callbackRef.current();
    });

    return () => {
      unsubFocus();
      if (typeof cleanup === 'function') cleanup();
    };
  }, [navigation]);

  // Ruta 2: Si NO hay contexto de navegación (fallback), ejecutar al montar
  useEffect(() => {
    if (navigation) return;
    return callbackRef.current();
  }, [navigation]);
}
