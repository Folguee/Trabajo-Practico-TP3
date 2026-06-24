/** 
FRONTEND + BACKEND INIT - Layout raíz de la app
FRONTEND: Configura la navegación (Stack) y muestra loading.
BACKEND INIT: Escucha cambios de autenticación del servicio backend
              y actualiza el estado global (authStore).
*/

import "../global.css";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colorScheme } from "nativewind";
import { onAuthChange } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const theme = useThemeStore((state) => state.theme);

  // Aplica el tema al motor de NativeWind para que las variantes `dark:`
  // se activen realmente en iOS/Android/web. Sin esto, sólo cambiaba el icono.
  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setAuth(firebaseUser);
      setIsReady(true);
    });

    // Red de seguridad: si por algún motivo el listener de auth no dispara,
    // marcamos la app como lista para no quedar en loading/pantalla negra.
    const timeout = setTimeout(() => setIsReady(true), 3000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  const isDark = theme === 'dark';

  return (
    <View
      style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#ffffff' }}
      className={isDark ? 'dark' : ''}
    >
      <Stack screenOptions={{ headerShown: false }} />
      {!isReady && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
            },
          ]}
        >
          <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#0f172a'} />
        </View>
      )}
    </View>
  );
}
