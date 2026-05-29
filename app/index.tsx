import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { WalletCards } from 'lucide-react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const BG_IMG = require('../assets/fondo.jpg');

export default function Index() {
  return (
    <ImageBackground
      source={BG_IMG}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/50 flex-row">
        {/* Left side: app name + description */}
        <View className="flex-1 justify-start items-center px-6 pt-20">
          <MaskedView
            maskElement={
              <Text className="text-6xl font-bold text-center tracking-tight mb-2">
                Mis Finanzas
              </Text>
            }
          >
            <LinearGradient
              colors={['#000', '#555']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 70 }}
            />
          </MaskedView>
          <Text className="text-black text-center text-lg leading-7 px-2 font-medium">
            Administra tus finanzas personales de forma simple y en un solo lugar.
          </Text>
        </View>

        {/* Right side: card with circular borders */}
          <View className="flex-1 justify-center items-center px-4">
          <View className="bg-white dark:bg-gray-800 rounded-3xl px-10 py-[50px] shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-[420px] items-center">
            <View className="bg-[#0f172a] w-20 h-20 rounded-3xl items-center justify-center mb-6">
              <WalletCards size={40} color="white" />
            </View>

            <Text className="text-4xl font-bold text-center text-slate-800 dark:text-gray-100 mb-10 tracking-tight">
              Control de Gastos
            </Text>

            <TouchableOpacity
              className="bg-[#0f172a] p-4 rounded-xl items-center mb-4 w-full"
              onPress={() => router.push('/login')}
            >
              <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 p-4 rounded-xl items-center w-full"
              onPress={() => router.push('/register')}
            >
              <Text className="text-slate-800 dark:text-gray-100 font-bold text-lg">Registrarme</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}
