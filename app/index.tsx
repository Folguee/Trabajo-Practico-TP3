/** 
FRONTEND - Pantalla de bienvenida (landing)
Esta es la primera pantalla que ve el usuario al abrir la app.
Muestra dos botones: Iniciar Sesión y Registrarme.
*/

import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-navy px-6">
      <Text className="text-3xl font-bold text-center mb-2 text-white">Control de Gastos</Text>
      <Text className="text-gray-400 text-center mb-12">Administra tus finanzas de forma simple</Text>

      <View className="w-full space-y-4">
        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-xl items-center active:bg-blue-700"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-semibold text-lg">Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 p-4 rounded-xl items-center active:bg-gray-300"
          onPress={() => router.push('/register')}
        >
          <Text className="text-navy font-semibold text-lg">Registrarme</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
