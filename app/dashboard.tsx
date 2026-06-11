import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
<<<<<<< HEAD
import { getTransactions, Transaction } from '../services/transaction.service';
import { getCategoryConfig, parseTransactionDate } from '../constants/transactions';
import {
  Plus,
  Wallet,
} from 'lucide-react-native';
import SidebarLayout from '../components/SidebarLayout';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
=======
import { useAuthStore } from '../store/authStore';
import { getTransactions, Transaction } from '../services/transaction.service';
import { logout } from '../services/auth.service';
import { getCategoryConfig, parseTransactionDate } from '../constants/transactions';
import { Plus, LogOut, Wallet } from 'lucide-react-native';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    const result = await getTransactions();
    setTransactions(result);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const { totalIncome, totalExpense, recentTransactions } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const sorted = [...transactions].sort((a, b) => {
      const dateA = parseTransactionDate(a.date);
      const dateB = parseTransactionDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      recentTransactions: sorted.slice(0, 3),
    };
  }, [transactions]);

  const balance = totalIncome - totalExpense;
  const hasTransactions = transactions.length > 0;
>>>>>>> origin/main

  const loadTransactions = useCallback(async () => {
    const result = await getTransactions();
    setTransactions(result);
    setIsLoading(false);
  }, []);

<<<<<<< HEAD
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const { totalIncome, totalExpense, recentTransactions } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += Math.max(0, t.amount);
      } else {
        expense += Math.abs(t.amount);
      }
    });

    const sorted = [...transactions].sort((a, b) => {
      const dateA = parseTransactionDate(a.date);
      const dateB = parseTransactionDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      recentTransactions: sorted.slice(0, 3),
    };
  }, [transactions]);

  const balance = totalIncome - totalExpense;
  const hasTransactions = transactions.length > 0;

  const renderEmptyState = () => (
    <View className="items-center py-8">
      <View className="bg-slate-100 dark:bg-gray-700 w-16 h-16 rounded-full items-center justify-center mb-4">
        <Wallet size={32} color="#94a3b8" />
      </View>
      <Text className="text-slate-800 dark:text-gray-100 font-semibold text-lg mb-2 text-center">
        Aún no tienes movimientos registrados
      </Text>
      <Text className="text-slate-500 dark:text-gray-400 text-center mb-4">
        Comienza a registrar tus ingresos y gastos para ver el resumen aquí.
      </Text>
      <TouchableOpacity
        className="bg-[#0f172a] rounded-xl px-6 py-3 flex-row items-center gap-2"
        onPress={() => router.push('/transaction-form')}
      >
        <Plus size={20} color="white" />
        <Text className="text-white font-semibold">Registrar movimiento</Text>
      </TouchableOpacity>
=======
  const renderEmptyState = () => (
    <View className="px-6 mt-8 mb-10">
      <View className="bg-white rounded-2xl p-8 items-center shadow-sm shadow-slate-200">
        <View className="bg-slate-100 w-16 h-16 rounded-full items-center justify-center mb-4">
          <Wallet size={32} color="#94a3b8" />
        </View>
        <Text className="text-slate-800 font-semibold text-lg mb-2 text-center">
          Aún no tienes movimientos registrados
        </Text>
        <Text className="text-slate-500 text-center mb-4">
          Comienza a registrar tus ingresos y gastos para ver el resumen aquí.
        </Text>
        <TouchableOpacity
          className="bg-[#0f172a] rounded-xl px-6 py-3 flex-row items-center gap-2"
          onPress={() => router.push('/transaction-form')}
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-semibold">Registrar movimiento</Text>
        </TouchableOpacity>
      </View>
>>>>>>> origin/main
    </View>
  );

  const renderRecentTransaction = (item: Transaction) => {
    const category = getCategoryConfig(item.category);
    const Icon = category.icon;
<<<<<<< HEAD
    const isExpense = item.type === 'expense' || item.type === 'shared';
=======
    const isExpense = item.type === 'expense';
>>>>>>> origin/main

    return (
      <TouchableOpacity
        key={item.id}
<<<<<<< HEAD
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700"
=======
        className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200"
>>>>>>> origin/main
        onPress={() =>
          item.id &&
          router.push({ pathname: '/transaction-detail', params: { id: item.id } })
        }
      >
        <View className="flex-row items-center gap-4 flex-1">
          <View className={`${category.bgColor} w-12 h-12 rounded-full items-center justify-center`}>
            <Icon size={24} color={category.iconColor} />
          </View>
          <View className="flex-1">
<<<<<<< HEAD
            <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{item.date || 'Sin fecha'}</Text>
=======
            <Text className="text-slate-800 font-semibold text-base" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">{item.date || 'Sin fecha'}</Text>
>>>>>>> origin/main
          </View>
        </View>
        <View className="items-end ml-3">
          <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} font-bold text-base`}>
            {isExpense ? '-' : '+'}${item.amount.toFixed(2)}
          </Text>
<<<<<<< HEAD
          <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{item.category || 'Sin categoria'}</Text>
=======
          <Text className="text-slate-400 text-xs mt-1">{item.category || 'Sin categoria'}</Text>
>>>>>>> origin/main
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
<<<<<<< HEAD
      <SidebarLayout active="dashboard">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      </SidebarLayout>
=======
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
>>>>>>> origin/main
    );
  }

  return (
<<<<<<< HEAD
    <SidebarLayout active="dashboard">
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
            <Text className="text-white text-3xl font-bold mb-2">Control de Gastos</Text>
            <Text className="text-slate-400 text-base">Gestiona tus finanzas personales</Text>
          </View>

          {hasTransactions && (
            <View className="px-6 -mt-16">
              <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20">
                <Text className="text-white text-lg font-bold mb-2">Resumen de Saldos</Text>
                <Text className={`text-4xl font-bold mb-6 text-center tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                  ${balance.toFixed(2)}
                </Text>

                <View className="flex-row items-center justify-between border-t border-slate-700 pt-4">
                  <View className="flex-1 items-center border-r border-slate-700">
                    <Text className="text-emerald-500/80 text-sm mb-1">Ingresos</Text>
                    <Text className="text-emerald-400 font-bold">+ ${totalIncome.toFixed(2)}</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-rose-500/80 text-sm mb-1">Gastos</Text>
                    <Text className="text-rose-400 font-bold">- ${totalExpense.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View className="px-6 mt-8">
            <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Acciones Rápidas</Text>
            <TouchableOpacity
              className="bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2"
              onPress={() => router.push('/transaction-form')}
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-semibold text-base">Ingresar nuevo ingreso/gasto</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-3xl mx-6 p-6 mt-8 mb-10 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            {hasTransactions ? (
              <>
                <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Transacciones Recientes</Text>
                {recentTransactions.map(renderRecentTransaction)}
                <TouchableOpacity onPress={() => router.push("/exportar")} className="bg-[#0f172a] p-3 rounded-xl mt-4" >
                  <Text className="text-white font-semibold text-center"> Ir a Exportar </Text>
                </TouchableOpacity>
              </>
            ) : (
              renderEmptyState()
            )}
          </View>

        </ScrollView>
      </View>
    </SidebarLayout>
  );
}
=======
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={handleLogout}>
              <LogOut size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-3xl font-bold mb-2">Control de Gastos</Text>
          <Text className="text-slate-400 text-base">Gestiona tus finanzas personales</Text>
        </View>

        {/* Resumen de Saldos Card (Overlapping) */}
        {hasTransactions && (
          <View className="px-6 -mt-16">
            <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20">
              <Text className="text-white text-lg font-bold mb-2">Resumen de Saldos</Text>
              <Text className={`text-4xl font-bold mb-6 text-center tracking-tight ${
                balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                ${balance.toFixed(2)}
              </Text>

              <View className="flex-row items-center justify-between border-t border-slate-700 pt-4">
                <View className="flex-1 items-center border-r border-slate-700">
                  <Text className="text-emerald-500/80 text-sm mb-1">Ingresos</Text>
                  <Text className="text-emerald-400 font-bold">+ ${totalIncome.toFixed(2)}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-rose-500/80 text-sm mb-1">Gastos</Text>
                  <Text className="text-rose-400 font-bold">- ${totalExpense.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Acciones Rápidas */}
        <View className="px-6 mt-8">
          <Text className="text-slate-800 text-lg font-bold mb-4">Acciones Rápidas</Text>

          <TouchableOpacity
            className="bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2"
            onPress={() => router.push('/transaction-form')}
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-semibold text-base">Ingresar nuevo ingreso/gasto</Text>
          </TouchableOpacity>
        </View>

        {/* Transacciones Recientes o Empty State */}
        <View className="px-6 mt-8 mb-10">
          {hasTransactions ? (
            <>
              <Text className="text-slate-800 text-lg font-bold mb-4">Transacciones Recientes</Text>
              {recentTransactions.map(renderRecentTransaction)}
            </>
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>
      <BottomNav active="dashboard" />
    </View>
  );
}
>>>>>>> origin/main
