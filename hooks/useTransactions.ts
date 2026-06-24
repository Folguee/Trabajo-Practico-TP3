import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { getTransactions, Transaction } from '../services/transaction.service';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      Alert.alert(
        'Error de conexion',
        error instanceof Error ? error.message : 'No se pudieron cargar los movimientos.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    isLoading,
    isRefreshing,
    loadTransactions,
    handleRefresh,
    setTransactions,
  };
}