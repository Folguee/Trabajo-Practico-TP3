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

const PIE_COLORS = ['#f43f5e', '#10b981', '#2563eb', '#9333ea', '#d97706', '#dc2626', '#059669', '#0ea5e9'];

export default function StatsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
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
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    const expensesByCategory = transactions
      .filter((item) => item.type === 'expense')
      .reduce<Record<string, number>>((acc, item) => {
        const category = item.category || 'Sin categoria';
        acc[category] = (acc[category] || 0) + item.amount;
        return acc;
      }, {});

    const pieData = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: PIE_COLORS[i % PIE_COLORS.length],
        legendFontColor: '#334155',
        legendFontSize: 13,
      }));

    const balancePieData = income > 0
      ? [
          {
            name: 'Gastado',
            value: Math.round(Math.min(expenses, income) * 100) / 100,
            color: '#f43f5e',
            legendFontColor: '#334155',
            legendFontSize: 13,
          },
          {
            name: 'Disponible',
            value: Math.round(Math.max(income - expenses, 0) * 100) / 100,
            color: '#10b981',
            legendFontColor: '#334155',
            legendFontSize: 13,
          },
        ]
      : [];

    return {
      income,
      expenses,
      balance: income - expenses,
      expensesByCategory: Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]),
      pieData,
      balancePieData,
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
    const limit = parseFloat(budgetInput);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido.');
      return;
    }
    setBudget(category, limit);
    setEditingBudget(null);
    setBudgetInput('');
  };

  const promptBudget = (category: string, currentLimit: number) => {
    setBudgetInput(currentLimit > 0 ? currentLimit.toString() : '');
    setEditingBudget(category);
  };

  return (
    <SidebarLayout active="stats">
      <View className="flex-1">
        <View className="bg-[#0f172a] pt-14 pb-20 px-6 rounded-b-3xl">
          <Text className="text-white text-3xl font-bold mb-2">Estadisticas</Text>
          <Text className="text-slate-400 text-base">Reportes de tus movimientos</Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0f172a" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-6 pt-6"
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20 mb-6">
              <Text className="text-white text-lg font-bold mb-2">Balance</Text>
              <Text className={`${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-4xl font-bold`}>
                ${stats.balance.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row gap-3 mb-6">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-1 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                <View className="bg-emerald-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <TrendingUp size={24} color="#10b981" />
                </View>
                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Ingresos</Text>
                <Text className="text-emerald-500 font-bold text-lg">${stats.income.toFixed(2)}</Text>
              </View>
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-1 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                <View className="bg-rose-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <TrendingDown size={24} color="#f43f5e" />
                </View>
                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Gastos</Text>
                <Text className="text-rose-500 font-bold text-lg">${stats.expenses.toFixed(2)}</Text>
              </View>
            </View>

            {stats.balancePieData.length > 0 && (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 items-center">
                <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Balance general</Text>
                <ChartKitPieChart
                  data={stats.balancePieData}
                  width={Dimensions.get('window').width - 72}
                  height={180}
                  chartConfig={{ color: () => '#334155' }}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                />
              </View>
            )}

            {stats.pieData.length > 0 && (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 items-center">
                <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Distribucion de gastos</Text>
                <ChartKitPieChart
                  data={stats.pieData}
                  width={Dimensions.get('window').width - 72}
                  height={200}
                  chartConfig={{ color: () => '#334155' }}
                  accessor="value"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                />
              </View>
            )}

            <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Presupuestos por categoria</Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6">
              {transactionCategories.filter((c) => c.name !== 'Ingresos').length === 0 ? (
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
                            ${spent.toFixed(0)}{budgetLimit > 0 ? ` / $${budgetLimit.toFixed(0)}` : ''}
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
                        <View className="flex-row items-center gap-2 mt-2">
                          <TextInput
                            className="flex-1 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-slate-800 dark:text-gray-100 text-base"
                            placeholder="Monto limite"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={budgetInput}
                            onChangeText={setBudgetInput}
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
                            onPress={() => setEditingBudget(null)}
                          >
                            <Text className="text-slate-600 dark:text-gray-300 font-semibold">X</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Gastos por categoria</Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6">
              {stats.expensesByCategory.length === 0 ? (
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
                        <Text className="text-rose-500 font-bold">${amount.toFixed(2)}</Text>
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
              {stats.recentTransactions.length === 0 ? (
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
                    <Text className={`${transaction.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>
                      {transaction.type === 'expense' ? '-' : '+'} ${transaction.amount.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SidebarLayout>
  );
}
