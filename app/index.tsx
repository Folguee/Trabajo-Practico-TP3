import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { WalletCards } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const BG_IMG = require('../assets/fondo-finanzas.png');

export default function Index() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Contenedor de fondo con posicionamiento fixed en web para evitar que se desplace al hacer scroll */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
      >
        <Image
          source={BG_IMG}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Gradiente oscuro superior para garantizar el contraste y legibilidad */}
        <LinearGradient
          colors={[
            'rgba(2, 6, 23, 0.45)',
            'rgba(2, 6, 23, 0.75)',
            '#020617'
          ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </View>

      <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          className="w-full"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Contenedor responsivo: En móviles se apila verticalmente, en pantallas grandes (desktop/Windows) se muestra en dos columnas */}
          <View className="w-full max-w-6xl px-6 py-12 md:py-20 flex-col md:flex-row md:items-center md:justify-between md:gap-12">

            {/* Columna Izquierda: Mensaje de Bienvenida (Hero) */}
            <View className="w-full md:w-1/2 items-center md:items-start mb-10 md:mb-0">
              <Text className="text-white text-4xl md:text-6xl font-extrabold text-center md:text-left tracking-tight leading-tight">
                Mis Finanzas
              </Text>
              <Text className="text-slate-300 text-base md:text-lg text-center md:text-left mt-4 max-w-md leading-relaxed">
                Administra tus finanzas personales de forma simple, segura y en un solo lugar.
              </Text>
            </View>

            {/* Columna Derecha: Tarjeta de Acciones (Diseño blanco similar a Login) */}
            <View className="w-full md:w-[420px] items-center">
              <View className="w-full bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 rounded-3xl px-8 py-10 items-center shadow-2xl">

                {/* Icono decorativo con fondo oscuro como el Login */}
                <View className="bg-[#0f172a] w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-slate-900/20">
                  <WalletCards size={isMobile ? 32 : 36} color="white" />
                </View>

                <Text className="text-slate-800 dark:text-gray-100 text-2xl font-bold text-center tracking-tight mb-8">
                  Control de Gastos
                </Text>

                {/* Botón Principal: Iniciar Sesión (Azul oscuro / Navy) */}
                <TouchableOpacity
                  className="w-full bg-[#0f172a] active:bg-slate-800 py-4 rounded-xl items-center justify-center mb-4 shadow-md"
                  onPress={() => router.push('/login')}
                  accessibilityRole="button"
                >
                  <Text className="text-white font-bold text-lg">
                    Iniciar Sesión
                  </Text>
                </TouchableOpacity>

                {/* Botón Secundario: Registrarme (Blanco con borde slate) */}
                <TouchableOpacity
                  className="w-full bg-white dark:bg-gray-800 active:bg-slate-50 border border-slate-200 dark:border-gray-700 py-4 rounded-xl items-center justify-center"
                  onPress={() => router.push('/register')}
                  accessibilityRole="button"
                >
                  <Text className="text-slate-700 dark:text-gray-200 font-bold text-lg">
                    Registrarme
                  </Text>
                </TouchableOpacity>

              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}