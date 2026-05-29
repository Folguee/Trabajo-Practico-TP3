import { create } from 'zustand';

interface BudgetState {
  budgets: Record<string, number>;
  setBudget: (category: string, limit: number) => void;
  removeBudget: (category: string) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: {},
  setBudget: (category, limit) =>
    set((state) => ({ budgets: { ...state.budgets, [category]: limit } })),
  removeBudget: (category) =>
    set((state) => {
      const { [category]: _, ...rest } = state.budgets;
      return { budgets: rest };
    }),
}));
