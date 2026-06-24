import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getTransactions, Transaction, deleteTransaction } from '../../services/transaction.service';
import { getCategoryConfig } from '../../constants/transactions';
import {
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
} from 'lucide-react-native';
import TransactionFormSheet from '../../components/TransactionFormSheet';
import TransactionDetailSheet from '../../components/TransactionDetailSheet';
import { formatCurrency } from '../../utils/money';
import { formatDisplayDate } from '../../utils/date';
import { useAuthStore } from '../../store/authStore';
import { useSafeFocusEffect } from '../../utils/useSafeFocusEffect';

export default function Dashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTxId, setFormTxId] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setTransactions(await getTransactions());
    } catch (error) {
      Alert.alert(
        'Error de conexion',
        error instanceof Error ? error.message : 'No se pudieron cargar los movimientos.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteSelected = async () => {
    if (!selectedTx?.id) return;

    const isWeb = typeof window !== 'undefined';
    const confirmed = isWeb
      ? window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Eliminar movimiento',
            'Esta acción no se puede deshacer.',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteTransaction(selectedTx.id);
      setIsDetailOpen(false);
      setSelectedTx(null);
      loadTransactions();
    } catch (error) {
      Alert.alert('Error al eliminar', `${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useSafeFocusEffect(
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

    return {
      totalIncome: income,
      totalExpense: expense,
      recentTransactions: transactions.slice(0, 4),
    };
  }, [transactions]);

  const balance = totalIncome - totalExpense;
  const hasTransactions = transactions.length > 0;

  const handleNavigate = useCallback((route: string) => {
    // replace (no push) para no apilar pestañas sobre la pestaña actual
    // y mantener el nav compartido montado.
    router.replace(route as any);
  }, []);

  const renderEmptyState = () => (
    <View className="items-center py-12 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <View className="bg-indigo-50 dark:bg-indigo-950/30 w-16 h-16 rounded-full items-center justify-center mb-4">
        <Wallet size={30} color="#6366f1" />
      </View>
      <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-2 text-center">
        Aún no tienes movimientos
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs leading-relaxed text-sm">
        Comienza a registrar tus ingresos y gastos para ver el resumen de tus finanzas aquí.
      </Text>
      <TouchableOpacity
        className="bg-indigo-600 active:bg-indigo-700 rounded-xl px-6 py-3.5 flex-row items-center gap-2 shadow-md shadow-indigo-600/10"
        onPress={() => {
          setFormTxId(null);
          setIsFormOpen(true);
        }}
      >
        <Plus size={18} color="white" />
        <Text className="text-white font-semibold">Registrar movimiento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentTransaction = (item: Transaction) => {
    const category = getCategoryConfig(item.categoryName);
    const Icon = category.icon;
    const isExpense = item.type === 'expense' || item.type === 'shared';

    return (
      <TouchableOpacity
        key={item.id}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm active:opacity-90"
        onPress={() => {
          setSelectedTx(item);
          setIsDetailOpen(true);
        }}
      >
        <View className="flex-row items-center gap-4 flex-1">
          <View className={`${category.bgColor} w-11 h-11 rounded-full items-center justify-center`}>
            <Icon size={20} color={category.iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-800 dark:text-slate-100 font-semibold text-sm" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">{formatDisplayDate(item.date)}</Text>
          </View>
        </View>
        <View className="items-end ml-3">
          <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} font-bold text-sm`}>
            {formatCurrency(item.amount, { sign: isExpense ? 'negative' : 'positive' })}
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">{item.categoryName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonTransaction = (key: number) => (
    <View key={key} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm opacity-60">
      <View className="flex-row items-center gap-4 flex-1">
        <View className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800" />
        <View className="flex-1 gap-2">
          <View className="h-4 w-28 bg-slate-200 dark:bg-slate-850 rounded" />
          <View className="h-3 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </View>
      </View>
      <View className="items-end gap-2 ml-3">
        <View className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        <View className="h-3 w-12 bg-slate-100 dark:bg-slate-800/60 rounded" />
      </View>
    </View>
  );

  return (
    <>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="bg-[#0f172a] pt-16 pb-28 px-6 rounded-b-[32px] md:pt-14 md:pb-24 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-3xl font-bold mb-1 tracking-tight">Control de Gastos</Text>
                <Text className="text-slate-400 text-sm">Gestiona tus finanzas personales</Text>
              </View>
            </View>
          </View>

          <View className="px-6 -mt-16">
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl min-h-[160px] justify-center">
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Resumen de Saldos</Text>
              {isLoading ? (
                <View className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg my-1" />
              ) : (
                <Text className={`text-4xl font-extrabold tracking-tight mb-6 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(balance)}
                </Text>
              )}

              <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <View className="flex-1 items-center border-r border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <ArrowUpRight size={14} color="#10b981" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Ingresos</Text>
                  </View>
                  {isLoading ? (
                    <View className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded my-1" />
                  ) : (
                    <Text className="text-emerald-500 font-bold text-sm">
                      {formatCurrency(totalIncome, { sign: 'positive' })}
                    </Text>
                  )}
                </View>
                <View className="flex-1 items-center">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <ArrowDownLeft size={14} color="#f43f5e" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gastos</Text>
                  </View>
                  {isLoading ? (
                    <View className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded my-1" />
                  ) : (
                    <Text className="text-rose-500 font-bold text-sm">
                      {formatCurrency(totalExpense, { sign: 'negative' })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View className="px-6 mt-8">
            <Text className="text-slate-800 dark:text-slate-200 text-lg font-bold mb-3">Acciones Rápidas</Text>
            <TouchableOpacity
              className="bg-[#0f172a] active:bg-slate-800 rounded-2xl p-4 flex-row items-center justify-center gap-2 shadow-md"
              onPress={() => {
                setFormTxId(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-bold text-base">Ingresar nuevo ingreso/gasto</Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 mt-8 mb-12">
            {isLoading ? (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-slate-800 dark:text-slate-200 text-lg font-bold">Transacciones Recientes</Text>
                </View>
                {[1, 2, 3].map(renderSkeletonTransaction)}
              </View>
            ) : hasTransactions ? (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-slate-800 dark:text-slate-200 text-lg font-bold">Transacciones Recientes</Text>
                  <TouchableOpacity
                    onPress={() => handleNavigate('/transacciones')}
                    className="flex-row items-center gap-1 active:opacity-75"
                  >
                    <Text className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">Ver todas</Text>
                    <ChevronRight size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                {recentTransactions.map(renderRecentTransaction)}

                <TouchableOpacity
                  onPress={() => handleNavigate('/exportar')}
                  className="bg-[#0f172a] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mt-4 active:bg-slate-800"
                >
                  <Text className="text-white dark:text-slate-200 font-bold text-center">Ir a Exportar Reportes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              renderEmptyState()
            )}
          </View>
        </ScrollView>
      <TransactionDetailSheet
        visible={isDetailOpen}
        transaction={selectedTx}
        currentUserUid={currentUser?.uid}
        isDeleting={isDeleting}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(id) => {
          setIsDetailOpen(false);
          setFormTxId(id);
          setIsFormOpen(true);
        }}
        onExport={(id) => {
          setIsDetailOpen(false);
          router.replace({ pathname: '/exportar', params: { transactionId: id } });
        }}
        onDelete={handleDeleteSelected}
      />

      <TransactionFormSheet
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        transactionId={formTxId}
        onSaveSuccess={loadTransactions}
      />
      </View>
    </>
  );
}
