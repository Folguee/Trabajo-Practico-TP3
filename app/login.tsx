import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../services/auth.service';
import { Wallet, Eye, EyeOff } from 'lucide-react-native';

const loginSchema = z.object({
  email: z.string().email('Ingrese un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const BG_IMG = require('../assets/fondo.jpg');

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: '', password: '' },
  });

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
    <ImageBackground
      source={BG_IMG}
      className="flex-1"
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/50"
      >
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-white dark:bg-gray-800 rounded-3xl px-10 py-12 w-full max-w-[420px] items-center shadow-xl dark:border dark:border-gray-700">
            <View className="bg-[#0f172a] w-16 h-16 rounded-2xl items-center justify-center mb-4">
              <Wallet size={32} color="white" />
            </View>
            <Text className="text-3xl font-bold text-center text-slate-800 dark:text-gray-100 mb-2">Bienvenido</Text>
            <Text className="text-slate-500 dark:text-gray-400 text-center mb-8">Inicia sesión para continuar</Text>

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

            <View className="w-full mb-6">
              <Text className="text-slate-700 dark:text-gray-300 font-medium mb-2 ml-1">Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative justify-center">
                    <TextInput
                      className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 pr-12 text-base text-slate-800 dark:text-gray-100 ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-gray-600'}`}
                      secureTextEntry={!showPassword}
                      placeholder="Mínimo 6 caracteres"
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

            <TouchableOpacity
              className="bg-[#0f172a] p-4 rounded-xl items-center w-full mt-2 disabled:opacity-50"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <Text className="text-white font-bold text-lg">
                {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-slate-500 dark:text-gray-400 font-medium">¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text className="text-indigo-600 font-bold">Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
