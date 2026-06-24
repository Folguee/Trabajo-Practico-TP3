import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Aplica el tema al motor de NativeWind para que las variantes `dark:`
// funcionen de verdad en iOS/Android/web. Se importa de forma perezosa para
// no romper los tests que corren en Node sin el entorno de RN.
function applyColorScheme(theme: Theme) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { colorScheme } = require('nativewind');
    colorScheme.set(theme);
  } catch {
    // Entorno sin NativeWind (p. ej. tests); se ignora.
  }
}

// Storage resiliente: si AsyncStorage no está disponible (tests en Node),
// no rompemos el store, sólo no persistimos.
const safeStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Persistencia no disponible; se ignora.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Persistencia no disponible; se ignora.
    }
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyColorScheme(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const next: Theme = state.theme === 'light' ? 'dark' : 'light';
          applyColorScheme(next);
          return { theme: next };
        }),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => safeStorage),
      // Al rehidratar desde disco, re-aplicamos el tema guardado.
      onRehydrateStorage: () => (state) => {
        if (state) applyColorScheme(state.theme);
      },
    }
  )
);
