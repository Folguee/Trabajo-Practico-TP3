import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Dashboard() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-4">
      <Text className="text-2xl font-bold mb-6">Dashboard</Text>
      <TouchableOpacity 
        className="bg-red-500 p-4 rounded-xl items-center w-full"
        onPress={() => router.replace('/login')}
      >
        <Text className="text-white font-semibold text-lg">Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}