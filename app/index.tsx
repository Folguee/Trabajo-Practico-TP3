import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Control de Gastos</Text>
      
      <View className="w-full space-y-4">
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-semibold text-lg">Iniciar Sesión</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-gray-200 p-4 rounded-xl items-center mt-4"
          onPress={() => router.push('/register')}
        >
          <Text className="text-gray-800 font-semibold text-lg">Crear Cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}