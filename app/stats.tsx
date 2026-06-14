import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  ArrowLeft,
  BarChart3,
  Pencil,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { PieChart as ChartKitPieChart } from 'react-native-chart-kit';
import SidebarLayout from '../components/SidebarLayout';
import { getTransactions, Transaction } from '../services/transaction.service';
import { getCategoryConfig, transactionCategories } from '../constants/transactions';
import { useBudgetStore } from '../store/budgetStore';
import { calculateStats } from '../utils/stats';
import {
  formatCurrency,
  formatMoneyInput,
  validateMoneyInput,
} from '../utils/money';

export default function StatsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const { budgets, setBudget } = useBudgetStore();

  const loadTransactions = useCallback(async () => {
    const result = await getTransactions();
    setTransactions(result);
    setIsLoading(false);
    setIsRefreshing(false);
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
      recentTransactions: transactions.slice(0, 5),
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
      setBudgetError(validation.error);
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
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Balance Total</Text>
              {isLoading ? (
                <View className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg my-1 animate-pulse" />
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
                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Ingresos</Text>
                {isLoading ? (
                  <View className="h-6 w-20 bg-slate-200 dark:bg-slate-750 rounded my-1 animate-pulse" />
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
                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Gastos</Text>
                {isLoading ? (
                  <View className="h-6 w-20 bg-slate-200 dark:bg-slate-750 rounded my-1 animate-pulse" />
                ) : (
                  <Text className="text-rose-500 font-bold text-lg">
                    {formatCurrency(stats.expenses)}
                  </Text>
                )}
              </View>
            </View>

            {isLoading ? (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 items-center min-h-[220px] justify-center">
                <View className="w-40 h-40 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
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
                      <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      <View className="h-4.5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </View>
                    <View className="h-4.5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </View>
                ))
              ) : transactionCategories.filter((c) => c.name !== 'Ingresos').length === 0 ? (
                <View className="items-center py-8">
                  <Wallet size={32} color="#94a3b8" />
                  <Text className="text-slate-400 dark:text-gray-500 mt-2">No hay categorias disponibles.</Text>
                </View>
              ) : (
                transactionCategories.filter((c) => c.name !== 'Ingresos').map(({ name: catName }) => {
                  const category = getCategoryConfig(catName);
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
                        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <View className="h-4.5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </View>
                      <View className="h-4.5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </View>
                    <View className="bg-slate-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                      <View className="bg-slate-200 dark:bg-slate-700 h-3 rounded-full animate-pulse" style={{ width: '40%' }} />
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
                  const category = getCategoryConfig(categoryName);
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
                      <View className="h-4.5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <View className="h-3 w-20 bg-slate-100 dark:bg-slate-700/60 rounded animate-pulse" />
                    </View>
                    <View className="h-4.5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
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
                    onPress={() =>
                      transaction.id &&
                      router.push({ pathname: '/transaction-detail', params: { id: transaction.id } })
                    }
                  >
                    <View>
                      <Text className="text-slate-800 dark:text-gray-100 font-semibold">{transaction.title}</Text>
                      <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{transaction.date || 'Sin fecha'}</Text>
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
    </SidebarLayout>
  );
}
