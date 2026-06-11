<<<<<<< HEAD
import { View, Text, TouchableOpacity, ImageBackground, BackHandler, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { WalletCards, X } from 'lucide-react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const BG_IMG = require('../assets/fondo.jpg');

const handleClose = () => {
  if (Platform.OS === 'android') {
    BackHandler.exitApp();
  } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open('', '_self');
    window.close();
    setTimeout(() => {
      Alert.alert(
        'Cerrar aplicación',
        'Si la pestaña no se cerró, cerrala manualmente. Para detener el servidor presioná Ctrl+C en la terminal donde corriste "npx expo start".'
      );
    }, 500);
  } else {
    Alert.alert('Cerrar aplicación', 'Para cerrar la app desliza hacia arriba y elimínala.');
  }
};

export default function Index() {
  return (
    <ImageBackground
      source={BG_IMG}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/50 flex-row">
        <TouchableOpacity
          className="absolute top-12 right-4 z-10 bg-white/80 dark:bg-gray-800/80 w-10 h-10 rounded-full items-center justify-center"
          onPress={handleClose}
        >
          <X size={22} color="#0f172a" />
=======
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
>>>>>>> origin/main
        </TouchableOpacity>
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

<<<<<<< HEAD
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
=======
        <TouchableOpacity
          className="bg-white border border-slate-200 p-4 rounded-xl items-center"
          onPress={() => router.push('/register')}
        >
          <Text className="text-slate-800 font-bold text-lg">Registrarme</Text>
        </TouchableOpacity>
      </View>
      
    </View>
>>>>>>> origin/main
  );
}