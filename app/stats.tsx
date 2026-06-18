import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  AlertTriangle,
  BarChart3,
  Pencil,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { PieChart as ChartKitPieChart } from 'react-native-chart-kit';
import SidebarLayout from '../components/SidebarLayout';
import TransactionDetailSheet from '../components/TransactionDetailSheet';
import TransactionFormSheet from '../components/TransactionFormSheet';
import {
  getTransactions,
  Transaction,
  deleteTransaction,
} from '../services/transaction.service';
import { getCategoryConfig } from '../constants/transactions';
import { useBudgetStore } from '../store/budgetStore';
import { useAuthStore } from '../store/authStore';
import { calculateStats } from '../utils/stats';
import {
  formatCurrency,
  formatMoneyInput,
  validateMoneyInput,
} from '../utils/money';
import { formatDisplayDate } from '../utils/date';
import { confirmDeleteTransaction } from '../utils/confirm';
import { getCategories } from '../services/category.service';
import type { Category } from '../types';

export default function StatsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTxId, setFormTxId] = useState<string | null>(null);
  const { budgets, setBudget } = useBudgetStore();
  const currentUser = useAuthStore((state) => state.user);

  const loadTransactions = useCallback(async () => {
    try {
      const [loadedTransactions, loadedCategories] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(loadedTransactions);
      setCategories(loadedCategories);
    } catch (error) {
      Alert.alert(
        'Error de conexion',
        error instanceof Error ? error.message : 'No se pudieron cargar las estadisticas.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const stats = useMemo(() => {
    const computed = calculateStats(transactions);

    return {
      ...computed,
      recentTransactions: computed.monthlyTransactions.slice(0, 5),
    };
  }, [transactions]);

  const maxCategoryExpense = Math.max(
    ...stats.expensesByCategory.map(([, amount]) => amount),
    1
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  const handleSetBudget = (category: string) => {
    const validation = validateMoneyInput(budgetInput);
    if (!validation.valid) {
      setBudgetError(
        'error' in validation ? validation.error : 'Monto invalido'
      );
      return;
    }
    setBudget(category, validation.value);
    setEditingBudget(null);
    setBudgetInput('');
    setBudgetError('');
  };

  const promptBudget = (category: string, currentLimit: number) => {
    setBudgetInput(currentLimit > 0 ? formatMoneyInput(currentLimit) : '');
    setBudgetError('');
    setEditingBudget(category);
  };

  const handleDeleteSelected = async () => {
    if (!selectedTx?.id) return;

    const confirmed = await confirmDeleteTransaction();
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteTransaction(selectedTx.id);
      setIsDetailOpen(false);
      setSelectedTx(null);
      loadTransactions();
    } catch (error) {
      Alert.alert(
        'Error al eliminar',
        `${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SidebarLayout active="stats">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera / Banner superior - Consistente con las demás pantallas (Sólido Navy #0f172a) */}
          <View className="bg-[#0f172a] pt-16 pb-28 px-6 rounded-b-[32px] md:pt-14 md:pb-24 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-3xl font-extrabold tracking-tight mb-1">Estadísticas</Text>
                <Text className="text-slate-400 text-sm">Reportes y análisis de tus movimientos</Text>
              </View>
              <View className="bg-slate-800/80 p-2.5 rounded-full border border-slate-700/50 hidden md:flex">
                <BarChart3 size={20} color="#818cf8" />
              </View>
            </View>
          </View>

          {/* Tarjeta de Balance principal (Estilo unificado con el Dashboard, flotando sobre el banner) */}
          <View className="px-6 -mt-16 mb-6">
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl min-h-[120px] justify-center">
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Balance del mes</Text>
              {isLoading ? (
                <View className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg my-1" />
              ) : (
                <Text className={`text-4xl font-extrabold tracking-tight ${stats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(stats.balance)}
                </Text>
              )}
            </View>
          </View>

          {/* Contenido Principal con Spacing */}
          <View className="px-6">
            <View className="flex-row gap-3 mb-6">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-1 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                <View className="bg-emerald-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <TrendingUp size={24} color="#10b981" />
                </View>
                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Ingresos del mes</Text>
                {isLoading ? (
                  <View className="h-6 w-20 bg-slate-200 dark:bg-slate-750 rounded my-1" />
                ) : (
                  <Text className="text-emerald-500 font-bold text-lg">
                    {formatCurrency(stats.income)}
                  </Text>
                )}
              </View>
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-1 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                <View className="bg-rose-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <TrendingDown size={24} color="#f43f5e" />
                </View>
                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Gastos del mes</Text>
                {isLoading ? (
                  <View className="h-6 w-20 bg-slate-200 dark:bg-slate-750 rounded my-1" />
                ) : (
                  <Text className="text-rose-500 font-bold text-lg">
                    {formatCurrency(stats.expenses)}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row flex-wrap gap-3 mb-6">
              {[
                ['Movimientos', String(stats.transactionCount)],
                ['Mayor gasto', formatCurrency(stats.largestExpense)],
                ['Promedio diario', formatCurrency(stats.averageDailyExpense)],
              ].map(([label, value]) => (
                <View key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 min-w-[30%] flex-1 border border-slate-100 dark:border-gray-700">
                  <Text className="text-slate-400 text-xs mb-1">{label}</Text>
                  <Text className="text-slate-800 dark:text-gray-100 font-bold">{value}</Text>
                </View>
              ))}
            </View>

            {isLoading ? (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 items-center min-h-[220px] justify-center">
                <View className="w-40 h-40 rounded-full bg-slate-200 dark:bg-slate-700" />
              </View>
            ) : (
              <>
                {stats.balancePieData.length > 0 && (
                  <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 items-center">
                    <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Balance general</Text>
                    <ChartKitPieChart
                      data={stats.balancePieData.map((item) => ({
                        ...item,
                        name: `${item.name}: ${formatCurrency(item.value)}`,
                      }))}
                      width={Dimensions.get('window').width - 72}
                      height={180}
                      chartConfig={{ color: () => '#334155' }}
                      accessor="value"
                      backgroundColor="transparent"
                      paddingLeft="0"
                    />
                  </View>
                )}

                {stats.pieData.length > 0 && (
                  <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 items-center">
                    <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Distribucion de gastos</Text>
                    <ChartKitPieChart
                      data={stats.pieData.map((item) => ({
                        ...item,
                        name: `${item.name}: ${formatCurrency(item.value)}`,
                      }))}
                      width={Dimensions.get('window').width - 72}
                      height={200}
                      chartConfig={{ color: () => '#334155' }}
                      accessor="value"
                      backgroundColor="transparent"
                      paddingLeft="0"
                    />
                  </View>
                )}
              </>
            )}

            <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Presupuestos por categoria</Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <View key={i} className="flex-row items-center justify-between mb-4 opacity-60">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <View className="h-4.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    </View>
                    <View className="h-4.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  </View>
                ))
              ) : categories.filter((c) => c.type === 'expense').length === 0 ? (
                <View className="items-center py-8">
                  <Wallet size={32} color="#94a3b8" />
                  <Text className="text-slate-400 dark:text-gray-500 mt-2">No hay categorias disponibles.</Text>
                </View>
              ) : (
                categories.filter((c) => c.type === 'expense').map((categoryData) => {
                  const catName = categoryData.name;
                  const category = getCategoryConfig(categoryData);
                  const Icon = category.icon;
                  const spent = stats.expensesByCategory.find(([n]) => n === catName)?.[1] || 0;
                  const budgetLimit = budgets[catName] || 0;
                  const percentage = budgetLimit > 0 ? Math.min((spent / budgetLimit) * 100, 100) : 0;
                  const isNearLimit = percentage >= 80;
                  const barColor = isNearLimit ? 'bg-rose-500' : 'bg-emerald-400';

                  return (
                    <View key={catName} className="mb-4">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-3">
                          <View className={`${category.bgColor} w-10 h-10 rounded-full items-center justify-center`}>
                            <Icon size={20} color={category.iconColor} />
                          </View>
                          <Text className="text-slate-800 dark:text-gray-100 font-semibold">{catName}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-slate-500 dark:text-gray-400 text-sm">
                            {formatCurrency(spent)}
                            {budgetLimit > 0 ? ` / ${formatCurrency(budgetLimit)}` : ''}
                          </Text>
                          {isNearLimit && budgetLimit > 0 && (
                            <AlertTriangle size={16} color="#f43f5e" />
                          )}
                          <TouchableOpacity onPress={() => promptBudget(catName, budgetLimit)}>
                            <Pencil size={14} color="#64748b" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {budgetLimit > 0 && (
                        <View className="bg-slate-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden mt-1">
                          <View
                            className={`h-2.5 rounded-full ${barColor}`}
                            style={{ width: `${Math.max(percentage, 2)}%` as `${number}%` }}
                          />
                        </View>
                      )}

                      {editingBudget === catName && (
                        <View className="mt-2">
                          <View className="flex-row items-center gap-2">
                            <TextInput
                              className={`flex-1 bg-slate-50 dark:bg-gray-700 border rounded-lg px-3 py-2 text-slate-800 dark:text-gray-100 text-base ${
                                budgetError ? 'border-rose-400' : 'border-slate-200 dark:border-gray-600'
                              }`}
                              placeholder="Monto límite"
                              placeholderTextColor="#94a3b8"
                              keyboardType="decimal-pad"
                              value={budgetInput}
                              onChangeText={(value) => {
                                setBudgetInput(formatMoneyInput(value));
                                if (budgetError) setBudgetError('');
                              }}
                              autoFocus
                            />
                            <TouchableOpacity
                              className="bg-[#0f172a] px-4 py-2 rounded-lg"
                              onPress={() => handleSetBudget(catName)}
                            >
                              <Text className="text-white font-semibold">OK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="bg-slate-200 dark:bg-gray-600 px-4 py-2 rounded-lg"
                              onPress={() => {
                                setEditingBudget(null);
                                setBudgetError('');
                              }}
                            >
                              <Text className="text-slate-600 dark:text-gray-300 font-semibold">X</Text>
                            </TouchableOpacity>
                          </View>
                          {budgetError ? (
                            <Text className="text-rose-500 text-xs mt-1">{budgetError}</Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Gastos por categoria</Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <View key={i} className="mb-4 opacity-60">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <View className="h-4.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                      </View>
                      <View className="h-4.5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                    </View>
                    <View className="bg-slate-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                      <View className="bg-slate-200 dark:bg-slate-700 h-3 rounded-full" style={{ width: '40%' }} />
                    </View>
                  </View>
                ))
              ) : stats.expensesByCategory.length === 0 ? (
                <View className="items-center py-8">
                  <BarChart3 size={32} color="#94a3b8" />
                  <Text className="text-slate-400 dark:text-gray-500 mt-2">Todavia no hay gastos cargados.</Text>
                </View>
              ) : (
                stats.expensesByCategory.map(([categoryName, amount]) => {
                  const category = getCategoryConfig(
                    categories.find((entry) => entry.name === categoryName) ||
                      categoryName
                  );
                  const Icon = category.icon;
                  const widthPercent = `${Math.max((amount / maxCategoryExpense) * 100, 8)}%` as `${number}%`;

                  return (
                    <View key={categoryName} className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-3">
                          <View className={`${category.bgColor} w-10 h-10 rounded-full items-center justify-center`}>
                            <Icon size={20} color={category.iconColor} />
                          </View>
                          <Text className="text-slate-800 dark:text-gray-100 font-semibold">{categoryName}</Text>
                        </View>
                        <Text className="text-rose-500 font-bold">
                          {formatCurrency(amount)}
                        </Text>
                      </View>
                      <View className="bg-slate-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                        <View className="bg-rose-400 h-3 rounded-full" style={{ width: widthPercent }} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Movimientos recientes</Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-10">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <View key={i} className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-gray-700 opacity-60">
                    <View className="gap-2">
                      <View className="h-4.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                      <View className="h-3 w-20 bg-slate-100 dark:bg-slate-700/60 rounded" />
                    </View>
                    <View className="h-4.5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  </View>
                ))
              ) : stats.recentTransactions.length === 0 ? (
                <View className="items-center py-8">
                  <Wallet size={32} color="#94a3b8" />
                  <Text className="text-slate-400 dark:text-gray-500 mt-2">Sin movimientos cargados.</Text>
                </View>
              ) : (
                stats.recentTransactions.map((transaction) => (
                  <TouchableOpacity
                    key={transaction.id || `${transaction.title}-${transaction.date}`}
                    className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-gray-700"
                    onPress={() => {
                      setSelectedTx(transaction);
                      setIsDetailOpen(true);
                    }}
                  >
                    <View>
                      <Text className="text-slate-800 dark:text-gray-100 font-semibold">{transaction.title}</Text>
                      <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{formatDisplayDate(transaction.date)}</Text>
                    </View>
                    <Text className={`${transaction.type === 'expense' || transaction.type === 'shared' ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>
                      {formatCurrency(transaction.amount, {
                        sign:
                          transaction.type === 'expense' || transaction.type === 'shared'
                            ? 'negative'
                            : 'positive',
                      })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Sheet de detalle de movimiento */}
      <TransactionDetailSheet
        visible={isDetailOpen}
        transaction={selectedTx}
        currentUserUid={currentUser?.uid}
        categories={categories}
        isDeleting={isDeleting}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(id) => {
          setIsDetailOpen(false);
          setFormTxId(id);
          setIsFormOpen(true);
        }}
        onExport={(id) => {
          setIsDetailOpen(false);
          router.push({ pathname: '/exportar', params: { transactionId: id } });
        }}
        onDelete={handleDeleteSelected}
      />

      <TransactionFormSheet
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        transactionId={formTxId}
        onSaveSuccess={loadTransactions}
      />
    </SidebarLayout>
  );
}
