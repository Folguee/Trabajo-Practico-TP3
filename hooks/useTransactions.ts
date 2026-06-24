import { useState, useCallback } from 'react';
import {
  deleteTransaction,
  getTransactions,
  Transaction,
} from '../services/transaction.service';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTransactions();
  }, [loadTransactions]);

  const removeTransaction = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
      await loadTransactions();
    },
    [loadTransactions]
  );

  return {
    transactions,
    isLoading,
    isRefreshing,
    loadTransactions,
    handleRefresh,
    removeTransaction,
    setTransactions,
  };
}