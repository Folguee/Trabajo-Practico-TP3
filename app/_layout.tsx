/** 
FRONTEND + BACKEND INIT - Layout raíz de la app
FRONTEND: Configura la navegación (Stack) y muestra loading.
BACKEND INIT: Escucha cambios de autenticación del servicio backend
              y actualiza el estado global (authStore).
*/

import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthChange } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setAuth(firebaseUser);
      setIsReady(true);
    });

    return unsub;
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View className={`flex-1 ${theme === 'dark' ? 'dark' : ''}`}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </QueryClientProvider>
  );
}
