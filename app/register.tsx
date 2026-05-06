/** 
FRONTEND - Pantalla de Registro
Solo UI y navegación. Llama al BACKEND (authService) para crear usuario.

Validaciones:

- Nombre: minimo 5 caracteres
- Email: formato valido
- Contraseña: minimo 5 caracteres, al menos una mayuscula y un numero
- Confirmar contraseña: debe coincidir con contraseña
*/

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerUser } from '../services/auth.service';

const registerSchema = z.object({
  name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres'),
  email: z.string().email('Ingrese un email valido'),
  password: z
    .string()
    .min(5, 'La contraseña debe tener al menos 5 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una letra mayuscula')
    .regex(/[0-9]/, 'Debe tener al menos un numero'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  // Llama al BACKEND para registrar un nuevo usuario
  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data.name, data.email, data.password);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-navy"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-3xl font-bold text-center mb-2 text-white">Crear Cuenta</Text>
        <Text className="text-gray-400 text-center mb-10">Registrate para comenzar</Text>

        <View className="mb-4">
          <Text className="text-gray-300 font-medium mb-2">Nombre</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-4 py-3 text-base ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Tu nombre"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name.message}</Text>}
        </View>

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

        <View className="mb-4">
          <Text className="text-gray-300 font-medium mb-2">Contraseña</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  className={`border rounded-lg px-4 py-3 pr-12 text-base ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  secureTextEntry={!showPassword}
                  placeholder="Minimo 5 caracteres, 1 mayuscula, 1 numero"
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

        <View className="mb-6">
          <Text className="text-gray-300 font-medium mb-2">Confirmar Contraseña</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  className={`border rounded-lg px-4 py-3 pr-12 text-base ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Repite la contraseña"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity
                  className="absolute right-4 top-3"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text className="text-gray-400 font-medium">{showConfirmPassword ? 'Ocultar' : 'Ver'}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.confirmPassword && <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</Text>}
        </View>

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-xl items-center disabled:opacity-50"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-semibold text-lg">
            {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text className="text-blue-600 font-semibold">Inicia Sesion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
