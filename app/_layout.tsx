import "../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuthStore } from "../store/authStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, (user) => {
        setAuth(user);
        setIsReady(true);
      });
      return unsub;
    } catch (error) {
      console.warn("Firebase not configured yet");
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}