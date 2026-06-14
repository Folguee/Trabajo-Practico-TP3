import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerUser } from '../services/auth.service';
import { UserPlus, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const registerSchema = z.object({
  name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres'),
  telefono: z.string().min(8, 'El teléfono es obligatorio'),
  email: z.string().email('Ingrese un email valido'),
  password: z
    .string()
    .min(5, 'La contraseña debe tener al menos 5 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const BG_IMG = require('../assets/fondo-finanzas.png');

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { name: '', telefono: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data.name, data.email, data.password, data.telefono);
      router.replace('/dashboard');
    } catch (error: any) {
      let message = 'Error al crear la cuenta';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email ya esta registrado';
      } else if (error.code === 'auth/weak-password') {
        message = 'La contraseña no cumple los requisitos';
      }
      Alert.alert('Error', message);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Contenedor de fondo con posicionamiento fixed en web para evitar que se desplace al hacer scroll */}
      <View
        style={{
          position: Platform.OS === 'web' ? 'fixed' : 'absolute',
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

            {/* Columna Derecha: Tarjeta de Registro */}
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
                  <UserPlus size={28} color="white" />
                </View>
                <Text className="text-2xl font-bold text-center text-slate-800 dark:text-gray-100 mb-1">Crear Cuenta</Text>
                <Text className="text-sm text-slate-500 dark:text-gray-400 text-center mb-6">Regístrate para comenzar</Text>

                <View className="w-full mb-3">
                  <Text className="text-slate-700 dark:text-gray-300 font-medium mb-1.5 ml-1 text-sm">Nombre</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-base text-slate-800 dark:text-gray-100 ${errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#94a3b8"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.name && <Text className="text-rose-500 text-sm mt-1 ml-1">{errors.name.message}</Text>}
                </View>

                <View className="w-full mb-3">
                  <Text className="text-slate-700 dark:text-gray-300 font-medium mb-1.5 ml-1 text-sm">Teléfono</Text>
                  <Controller
                    control={control}
                    name="telefono"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-base text-slate-800 dark:text-gray-100 ${errors.telefono ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                        keyboardType="phone-pad"
                        placeholder="Tu número de celular"
                        placeholderTextColor="#94a3b8"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.telefono && <Text className="text-rose-500 text-sm mt-1 ml-1">{errors.telefono.message}</Text>}
                </View>

                <View className="w-full mb-3">
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
                      />
                    )}
                  />
                  {errors.email && <Text className="text-rose-500 text-sm mt-1 ml-1">{errors.email.message}</Text>}
                </View>

                <View className="w-full mb-3">
                  <Text className="text-slate-700 dark:text-gray-300 font-medium mb-1.5 ml-1 text-sm">Contraseña</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative justify-center">
                        <TextInput
                          className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 pr-12 text-base text-slate-800 dark:text-gray-100 ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                          secureTextEntry={!showPassword}
                          placeholder="5+ con Mayús y Núm"
                          placeholderTextColor="#94a3b8"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
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

                <View className="w-full mb-5">
                  <Text className="text-slate-700 dark:text-gray-300 font-medium mb-1.5 ml-1 text-sm">Confirmar Contraseña</Text>
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative justify-center">
                        <TextInput
                          className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 pr-12 text-base text-slate-800 dark:text-gray-100 ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                          secureTextEntry={!showConfirmPassword}
                          placeholder="Repite la contraseña"
                          placeholderTextColor="#94a3b8"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                        <TouchableOpacity
                          className="absolute right-4"
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} color="#64748b" />
                          ) : (
                            <Eye size={20} color="#64748b" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.confirmPassword && <Text className="text-rose-500 text-sm mt-1 ml-1">{errors.confirmPassword.message}</Text>}
                </View>

                <TouchableOpacity
                  className="bg-[#0f172a] active:bg-slate-800 py-3.5 rounded-xl items-center justify-center w-full mt-2 disabled:opacity-50 shadow-md"
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  <Text className="text-white font-bold text-lg">
                    {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-6">
                  <Text className="text-slate-500 dark:text-gray-400 font-medium text-sm">¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text className="text-indigo-600 font-bold text-sm">Inicia Sesión</Text>
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
