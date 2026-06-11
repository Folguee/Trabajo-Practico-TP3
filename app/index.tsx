import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { WalletCards } from 'lucide-react-native';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-6">
      
      <View className="bg-[#0f172a] w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-sm shadow-slate-300">
        <WalletCards size={40} color="white" />
      </View>
      
      <Text className="text-4xl font-bold text-center text-slate-800 mb-3 tracking-tight">Control de Gastos</Text>
      <Text className="text-slate-500 text-center text-base mb-14 px-4">
        Administra tus finanzas personales de forma simple y en un solo lugar.
      </Text>

      <View className="w-full">
        <TouchableOpacity
          className="bg-[#0f172a] p-4 rounded-xl items-center mb-4 shadow-sm shadow-slate-300"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white border border-slate-200 p-4 rounded-xl items-center"
          onPress={() => router.push('/register')}
        >
          <Text className="text-slate-800 font-bold text-lg">Registrarme</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}