/** 
FRONTEND - Pantalla Dashboard (después de iniciar sesión)
Muestra info del usuario y llama al BACKEND (authService) para cerrar sesión.
*/

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth.service';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 bg-navy">
      <View className="pt-12 pb-4 px-6 flex-row justify-between items-center">
        <View>
          <Text className="text-white text-lg font-bold">
            Hola, {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text className="text-red-400 font-medium">Cerrar Sesion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-2">Balance Total</Text>
          <View className="bg-gray-800 rounded-xl p-6">
            <Text className="text-gray-500 text-sm">$ 0.00</Text>
          </View>
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-green-900/30 rounded-xl p-4">
            <Text className="text-gray-400 text-xs mb-1">Ingresos</Text>
            <Text className="text-green-400 text-lg font-semibold">$ 0.00</Text>
          </View>
          <View className="flex-1 bg-red-900/30 rounded-xl p-4">
            <Text className="text-gray-400 text-xs mb-1">Gastos</Text>
            <Text className="text-red-400 text-lg font-semibold">$ 0.00</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-400 text-sm font-medium mb-3">Accesos Rapidos</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-blue-600 rounded-xl p-4 items-center">
              <Text className="text-white font-medium">Agregar</Text>
              <Text className="text-white text-xs">Ingreso</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-orange-600 rounded-xl p-4 items-center">
              <Text className="text-white font-medium">Agregar</Text>
              <Text className="text-white text-xs">Gasto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-10">
          <Text className="text-gray-400 text-sm font-medium mb-3">Ultimos Movimientos</Text>
          <View className="bg-gray-800 rounded-xl p-6 items-center">
            <Text className="text-gray-500">No hay movimientos</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
