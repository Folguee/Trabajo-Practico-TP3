/** 
FRONTEND - Pantalla de Login
Solo UI y navegación. Llama al BACKEND (authService) para iniciar sesión.
*/

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../services/auth.service';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: '', password: '' },
  });

  // Llama al BACKEND para iniciar sesión
  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      router.replace('/dashboard');
    } catch (error: any) {
      let message = 'Error al iniciar sesion';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Email o contraseña incorrectos';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email invalido';
      }
      Alert.alert('Error', message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-navy"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-2 text-white">Bienvenido</Text>
        <Text className="text-gray-400 text-center mb-10">Inicia sesion en tu cuenta</Text>

        <View className="mb-4">
          <Text className="text-gray-300 font-medium mb-2">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-4 py-3 text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="tu@email.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>}
        </View>

        <View className="mb-6">
          <Text className="text-gray-300 font-medium mb-2">Contraseña</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  className={`border rounded-lg px-4 py-3 pr-12 text-base ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  secureTextEntry={!showPassword}
                  placeholder="Minimo 6 caracteres"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity
                  className="absolute right-4 top-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text className="text-gray-400 font-medium">{showPassword ? 'Ocultar' : 'Ver'}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && <Text className="text-red-500 text-sm mt-1">{errors.password.message}</Text>}
        </View>

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-xl items-center disabled:opacity-50"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-semibold text-lg">
            {isSubmitting ? 'Ingresando...' : 'Iniciar Sesion'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="text-blue-600 font-semibold">Registrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
