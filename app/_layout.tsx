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
import { onAuthChange } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const theme = useThemeStore((state) => state.theme);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className={theme === 'dark' ? 'dark' : ''}>
      <Stack screenOptions={{ headerShown: false }} />
      {!isReady && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
          ]}
        >
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}
    </View>
  );
}
