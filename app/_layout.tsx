/** 
FRONTEND + BACKEND INIT - Layout raíz de la app
FRONTEND: Configura la navegación (Stack) y muestra loading.
BACKEND INIT: Escucha cambios de autenticación del servicio backend
              y actualiza el estado global (authStore).
*/

import "../global.css";
import { router, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthChange } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setAuth(firebaseUser);
      setIsReady(true);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const firstSegment = segments[0];
    const publicRoute =
      !firstSegment ||
      firstSegment === 'login' ||
      firstSegment === 'register';

    if (!user && !publicRoute) {
      router.replace('/login');
    } else if (user && publicRoute) {
      router.replace('/dashboard');
    }
  }, [isReady, segments, user]);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'dark' : ''}`}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
