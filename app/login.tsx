import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../services/auth.service';
import { Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GoogleSignInButton from '../components/GoogleSignInButton';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const BG_IMG = require('../assets/fondo-finanzas.png');

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const passwordRef = useRef<any>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMessage(null);
    try {
      await login(data.email, data.password);
      router.replace('/dashboard');
    } catch (error: any) {
      let message = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Email o contraseña incorrectos';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      } else if (error.message) {
        message = error.message;
      }
      setErrorMessage(message);
    }
  };

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
          className="w-full"
        >
          {/* Contenedor responsivo: En móviles se apila verticalmente, en pantallas grandes (desktop/Windows) se muestra en dos columnas */}
          <View className="w-full max-w-6xl px-6 py-12 md:py-20 flex-col md:flex-row md:items-center md:justify-between md:gap-12">
            
            {/* Columna Izquierda: Mensaje de Bienvenida (Solo visible en escritorio) */}
            <View className="hidden md:flex md:w-1/2 items-start">
              <Text className="text-white md:text-6xl font-extrabold text-left tracking-tight leading-tight">
                Mis Finanzas
              </Text>
              <Text className="text-slate-300 md:text-lg text-left mt-4 max-w-md leading-relaxed">
                Administra tus finanzas personales de forma simple, segura y en un solo lugar.
              </Text>
            </View>

            {/* Columna Derecha: Tarjeta de Login */}
            <View className="w-full md:w-[420px] items-center">
              {/* Título de la Aplicación (Solo visible en móviles para identificar la app) */}
              <TouchableOpacity
                onPress={() => router.push('/')}
                className="mb-6 active:opacity-85 md:hidden"
              >
                <Text className="text-white text-3xl font-extrabold text-center tracking-tight">
                  Mis Finanzas
                </Text>
              </TouchableOpacity>

              <View className="w-full bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 rounded-3xl px-6 py-8 md:px-8 md:py-10 items-center shadow-2xl">
                <View className="bg-[#0f172a] w-14 h-14 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
                  <Wallet size={28} color="white" />
                </View>
                <Text className="text-2xl font-bold text-center text-slate-800 dark:text-gray-100 mb-1">Bienvenido</Text>
                <Text className="text-sm text-slate-500 dark:text-gray-400 text-center mb-6">Inicia sesión para continuar</Text>

                {errorMessage && (
                  <View className="w-full flex-row items-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3.5 mb-4">
                    <AlertCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text className="text-rose-600 dark:text-rose-400 text-sm font-medium flex-1">
                      {errorMessage}
                    </Text>
                  </View>
                )}

                <View className="w-full mb-4">
                  <Text className="text-slate-700 dark:text-gray-300 font-medium mb-1.5 ml-1 text-sm">Email</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-base text-slate-800 dark:text-gray-100 ${errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="tu@email.com"
                        placeholderTextColor="#94a3b8"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    )}
                  />
                  {errors.email && <Text className="text-rose-500 text-sm mt-1 ml-1">{errors.email.message}</Text>}
                </View>

                <View className="w-full mb-6">
                  <Text className="text-slate-700 dark:text-gray-300 font-medium mb-1.5 ml-1 text-sm">Contraseña</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative justify-center">
                        <TextInput
                          ref={passwordRef}
                          className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 pr-12 text-base text-slate-800 dark:text-gray-100 ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                          secureTextEntry={!showPassword}
                          placeholder="Mínimo 6 caracteres"
                          placeholderTextColor="#94a3b8"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(onSubmit)}
                        />
                        <TouchableOpacity
                          className="absolute right-4"
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={20} color="#64748b" />
                          ) : (
                            <Eye size={20} color="#64748b" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.password && <Text className="text-rose-500 text-sm mt-1 ml-1">{errors.password.message}</Text>}
                </View>

                <TouchableOpacity
                  className="bg-[#0f172a] active:bg-slate-800 py-3.5 rounded-xl items-center justify-center w-full mt-2 disabled:opacity-50 shadow-md"
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting || isGoogleSubmitting}
                >
                  <Text className="text-white font-bold text-lg">
                    {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
                  </Text>
                </TouchableOpacity>

                {/* Login con Google (web: popup; mobile: OAuth nativo si hay Client IDs) */}
                <GoogleSignInButton
                  disabled={isSubmitting || isGoogleSubmitting}
                  isSubmitting={isGoogleSubmitting}
                  setIsSubmitting={setIsGoogleSubmitting}
                  onError={(message) => setErrorMessage(message || null)}
                />

                <View className="flex-row justify-center mt-6">

                  <Text className="text-slate-500 dark:text-gray-400 font-medium text-sm">¿No tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text className="text-indigo-600 font-bold text-sm">Regístrate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}