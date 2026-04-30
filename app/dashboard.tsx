/** 
FRONTEND - Pantalla Dashboard (después de iniciar sesión)
Muestra info del usuario y llama al BACKEND (authService) para cerrar sesión.
*/

import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth.service';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  // Llama al BACKEND para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-navy p-4">
      <Text className="text-2xl font-bold mb-2 text-white">Dashboard</Text>
      <Text className="text-gray-300 mb-6">
        Hola, {user?.displayName || user?.email || 'Usuario'}
      </Text>
      <TouchableOpacity
        className="bg-red-500 p-4 rounded-xl items-center w-full"
        onPress={handleLogout}
      >
        <Text className="text-white font-semibold text-lg">Cerrar Sesion</Text>
      </TouchableOpacity>
    </View>
  );
}
