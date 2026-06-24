import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { register as registerUser } from '../services/auth.service';

export const registerSchema = z
  .object({
    name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres'),
    telefono: z.string().min(8, 'El teléfono es obligatorio'),
    email: z.string().email('Ingrese un email valido'),
    password: z
      .string()
      .min(5, 'La contraseña debe tener al menos 5 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterForm = z.infer<typeof registerSchema>;

export function useRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      name: '',
      telefono: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
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

  return {
    control,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
  };
}
