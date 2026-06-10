import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerUser } from '../services/auth.service';
import { UserPlus, Eye, EyeOff } from 'lucide-react-native';

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

const BG_IMG = require('../assets/fondo.jpg');

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
    <ImageBackground
      source={BG_IMG}
      className="flex-1"
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/50"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white dark:bg-gray-800 rounded-3xl px-10 py-12 w-full max-w-[420px] mx-8 items-center shadow-xl dark:border dark:border-gray-700">
            <View className="bg-[#0f172a] w-16 h-16 rounded-2xl items-center justify-center mb-4">
              <UserPlus size={32} color="white" />
            </View>
            <Text className="text-3xl font-bold text-center text-slate-800 dark:text-gray-100 mb-2">Crear Cuenta</Text>
            <Text className="text-slate-500 dark:text-gray-400 text-center mb-8">Regístrate para comenzar</Text>

            <View className="w-full mb-4">
              <Text className="text-slate-700 dark:text-gray-300 font-medium mb-2 ml-1">Nombre</Text>
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

            <View className="w-full mb-4">
              <Text className="text-slate-700 dark:text-gray-300 font-medium mb-2 ml-1">Teléfono</Text>
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

            <View className="w-full mb-4">
              <Text className="text-slate-700 dark:text-gray-300 font-medium mb-2 ml-1">Email</Text>
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

            <View className="w-full mb-4">
              <Text className="text-slate-700 dark:text-gray-300 font-medium mb-2 ml-1">Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative justify-center">
                    <TextInput
                      className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 pr-12 text-base text-slate-800 dark:text-gray-100 ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                      secureTextEntry={!showPassword}
                      placeholder="5+ caracteres, 1 mayúscula, 1 número"
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

            <View className="w-full mb-6">
              <Text className="text-slate-700 dark:text-gray-300 font-medium mb-2 ml-1">Confirmar Contraseña</Text>
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
              className="bg-[#0f172a] p-4 rounded-xl items-center w-full mt-2 disabled:opacity-50"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <Text className="text-white font-bold text-lg">
                {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-slate-500 dark:text-gray-400 font-medium">¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-indigo-600 font-bold">Inicia Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}