import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../authStore';
import { useBudgetStore } from '../budgetStore';
import { useThemeStore } from '../themeStore';
import type { User } from 'firebase/auth';

describe('Global Zustand Stores', () => {
  beforeEach(() => {
    // Reset stores to their initial state before each test
    useAuthStore.setState({ user: null });
    useBudgetStore.setState({ budgets: {} });
    useThemeStore.setState({ theme: 'light' });
  });

  describe('useAuthStore', () => {
    it('debería inicializarse con el usuario en null', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('debería actualizar el estado del usuario con setAuth', () => {
      const mockUser = { uid: 'auth_user_123', email: 'test@example.com' } as User;
      
      useAuthStore.getState().setAuth(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });

    it('debería limpiar el usuario al pasar null a setAuth', () => {
      const mockUser = { uid: 'auth_user_123', email: 'test@example.com' } as User;
      
      useAuthStore.getState().setAuth(mockUser);
      expect(useAuthStore.getState().user).not.toBeNull();
      
      useAuthStore.getState().setAuth(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('useBudgetStore', () => {
    it('debería inicializarse con un objeto de presupuestos vacío', () => {
      const state = useBudgetStore.getState();
      expect(state.budgets).toEqual({});
    });

    it('debería establecer un presupuesto con setBudget', () => {
      useBudgetStore.getState().setBudget('Alimentacion', 50000);
      
      let state = useBudgetStore.getState();
      expect(state.budgets).toEqual({ Alimentacion: 50000 });

      // Actualizar el mismo u otro presupuesto
      useBudgetStore.getState().setBudget('Transporte', 15000);
      state = useBudgetStore.getState();
      expect(state.budgets).toEqual({
        Alimentacion: 50000,
        Transporte: 15000,
      });
    });

    it('debería eliminar un presupuesto con removeBudget', () => {
      useBudgetStore.getState().setBudget('Alimentacion', 50000);
      useBudgetStore.getState().setBudget('Transporte', 15000);
      
      useBudgetStore.getState().removeBudget('Alimentacion');
      
      const state = useBudgetStore.getState();
      expect(state.budgets).toEqual({ Transporte: 15000 });
      expect(state.budgets['Alimentacion']).toBeUndefined();
    });
  });

  describe('useThemeStore', () => {
    it('debería inicializarse con el tema en light', () => {
      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
    });

    it('debería alternar entre light y dark con toggleTheme', () => {
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().theme).toBe('dark');

      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().theme).toBe('light');
    });
  });
});
