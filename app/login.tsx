import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Login() {
  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Login</Text>
      <TouchableOpacity 
        className="bg-blue-600 p-4 rounded-xl items-center w-full"
        onPress={() => router.replace('/dashboard')}
      >
        <Text className="text-white font-semibold text-lg">Ingresar</Text>
      </TouchableOpacity>
    </View>
  );
}