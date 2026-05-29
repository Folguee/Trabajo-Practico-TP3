
 /*FRONTEND - Estado global de autenticación (Zustand)
 Maneja el estado del usuario logueado en toda la app.
 El BACKEND (auth.service) actualiza este estado cuando cambia la sesión.
 El FRONTEND (pantallas) lee este estado para saber si hay usuario.*/


import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  setAuth: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setAuth: (user) => set({ user }),
}));
