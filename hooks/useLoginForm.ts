import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../services/auth.service';

export const loginSchema = z.object({
  email: z.email('Ingrese un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: LoginForm) => {
    setErrorMessage(null);

    try {
      await login(email, password);
      return true;
    } catch (error: any) {
      setErrorMessage(
        error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password'
          ? 'Email o contraseña incorrectos'
          : error?.code === 'auth/invalid-email'
            ? 'Email inválido'
            : error?.message || 'Error al iniciar sesión'
      );
      return false;
    }
  };

  return {
    control,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    onSubmit,
  };
}