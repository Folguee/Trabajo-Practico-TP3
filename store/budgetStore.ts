import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BudgetState {
  budgets: Record<string, number>;
  setBudget: (category: string, limit: number) => void;
  removeBudget: (category: string) => void;
}

// Storage resiliente: si AsyncStorage no está disponible (p. ej. en tests
// corriendo en Node sin entorno RN), no rompemos el store, sólo no persistimos.
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

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budgets: {},
      setBudget: (category, limit) =>
        set((state) => ({ budgets: { ...state.budgets, [category]: limit } })),
      removeBudget: (category) =>
        set((state) => {
          const { [category]: _, ...rest } = state.budgets;
          return { budgets: rest };
        }),
    }),
    {
      name: 'budget-store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
