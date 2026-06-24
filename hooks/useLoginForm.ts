import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { login } from '../services/auth.service';

export const loginSchema = z.object({
  email: z.string().email('Ingrese un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const passwordRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
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

  const handleQuickLogin = async () => {
    const quickEmail = 'juan@gmail.com';
    const quickPassword = 'Hola123!';

    setValue('email', quickEmail, { shouldValidate: true });
    setValue('password', quickPassword, { shouldValidate: true });
    await onSubmit({ email: quickEmail, password: quickPassword });
  };

  return {
    control,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    errorMessage,
    setErrorMessage,
    isGoogleSubmitting,
    setIsGoogleSubmitting,
    passwordRef,
    handleQuickLogin,
    onSubmit,
  };
}