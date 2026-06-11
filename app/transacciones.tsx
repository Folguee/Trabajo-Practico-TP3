import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
<<<<<<< HEAD
=======
  ArrowLeft,
>>>>>>> origin/main
  CalendarDays,
  Filter,
  Plus,
  Search,
} from 'lucide-react-native';
<<<<<<< HEAD
import SidebarLayout from '../components/SidebarLayout';
import { getTransactions, Transaction } from '../services/transaction.service';
import {
  formatDateInput,
=======
import BottomNav from '../components/BottomNav';
import { getTransactions, Transaction } from '../services/transaction.service';
import {
>>>>>>> origin/main
  getCategoryConfig,
  parseTransactionDate,
  transactionCategories,
} from '../constants/transactions';

type TypeFilter = 'all' | 'income' | 'expense';
<<<<<<< HEAD
type DateFilter = 'all' | 'today' | 'month' | 'custom';
=======
type DateFilter = 'all' | 'today' | 'month';
>>>>>>> origin/main

const typeFilters: Array<{ label: string; value: TypeFilter }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' },
];

const dateFilters: Array<{ label: string; value: DateFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Este mes', value: 'month' },
<<<<<<< HEAD
  { label: 'Personalizado', value: 'custom' },
];

const formatAmount = (transaction: Transaction) => {
  const isExpense = transaction.type === 'expense' || transaction.type === 'shared';
  const sign = isExpense ? '-' : '+';
=======
];

const formatAmount = (transaction: Transaction) => {
  const sign = transaction.type === 'expense' ? '-' : '+';
>>>>>>> origin/main
  return `${sign} $${transaction.amount.toFixed(2)}`;
};

const isSameDay = (first: Date, second: Date) =>
  first.getDate() === second.getDate() &&
  first.getMonth() === second.getMonth() &&
  first.getFullYear() === second.getFullYear();

export default function Transacciones() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
<<<<<<< HEAD
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
=======
>>>>>>> origin/main
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const filteredTransactions = useMemo(() => {
    const today = new Date();
<<<<<<< HEAD
    const fromDate = dateFilter === 'custom' && dateFrom ? parseTransactionDate(dateFrom) : null;
    const toDate = dateFilter === 'custom' && dateTo ? parseTransactionDate(dateTo) : null;
=======
>>>>>>> origin/main

    return transactions.filter((transaction) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        transaction.category?.toLowerCase().includes(normalizedSearch) ||
        transaction.note?.toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesCategory =
        categoryFilter === 'Todas' || transaction.category === categoryFilter;
      const transactionDate = parseTransactionDate(transaction.date);
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' &&
          transactionDate !== null &&
          isSameDay(transactionDate, today)) ||
        (dateFilter === 'month' &&
          transactionDate !== null &&
          transactionDate.getMonth() === today.getMonth() &&
<<<<<<< HEAD
          transactionDate.getFullYear() === today.getFullYear()) ||
        (dateFilter === 'custom' &&
          transactionDate !== null &&
          (!fromDate || transactionDate >= fromDate) &&
          (!toDate || transactionDate <= toDate));

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [categoryFilter, dateFilter, search, transactions, typeFilter, dateFrom, dateTo]);
=======
          transactionDate.getFullYear() === today.getFullYear());

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [categoryFilter, dateFilter, search, transactions, typeFilter]);
>>>>>>> origin/main

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategoryConfig(item.category);
    const Icon = category.icon;
<<<<<<< HEAD
    const isExpense = item.type === 'expense' || item.type === 'shared';

    return (
      <TouchableOpacity
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700"
=======
    const isExpense = item.type === 'expense';

    return (
      <TouchableOpacity
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
            {formatAmount(item)}
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

  const ListHeader = (
    <View>
<<<<<<< HEAD
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 flex-row gap-3">
        <View className="flex-1 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3 flex-row items-center gap-2">
=======
      <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200 mb-6 flex-row gap-3">
        <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-row items-center gap-2">
>>>>>>> origin/main
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Buscar movimiento..."
            placeholderTextColor="#94a3b8"
<<<<<<< HEAD
            className="flex-1 text-slate-800 dark:text-gray-100 text-base"
=======
            className="flex-1 text-slate-800 text-base"
>>>>>>> origin/main
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          className="bg-[#0f172a] w-12 h-12 rounded-xl items-center justify-center"
          onPress={() => router.push('/transaction-form')}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center gap-2 mb-3">
        <Filter size={18} color="#0f172a" />
<<<<<<< HEAD
        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold">Filtros</Text>
=======
        <Text className="text-slate-800 text-lg font-bold">Filtros</Text>
>>>>>>> origin/main
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {typeFilters.map((filter) => {
            const isActive = typeFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
<<<<<<< HEAD
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'}`}
                onPress={() => setTypeFilter(filter.value)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
=======
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60'}`}
                onPress={() => setTypeFilter(filter.value)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>
>>>>>>> origin/main
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {['Todas', ...transactionCategories.map((category) => category.name)].map((category) => {
            const isActive = categoryFilter === category;

            return (
              <TouchableOpacity
                key={category}
<<<<<<< HEAD
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'}`}
                onPress={() => setCategoryFilter(category)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
=======
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60'}`}
                onPress={() => setCategoryFilter(category)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>
>>>>>>> origin/main
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

<<<<<<< HEAD
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
=======
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
>>>>>>> origin/main
        <View className="flex-row gap-2">
          {dateFilters.map((filter) => {
            const isActive = dateFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
<<<<<<< HEAD
                  isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'
=======
                  isActive ? 'bg-slate-950' : 'bg-slate-200/60'
>>>>>>> origin/main
                }`}
                onPress={() => setDateFilter(filter.value)}
              >
                <CalendarDays size={16} color={isActive ? 'white' : '#475569'} />
<<<<<<< HEAD
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
=======
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>
>>>>>>> origin/main
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

<<<<<<< HEAD
      {dateFilter === 'custom' && (
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3">
            <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Desde (DD/MM/AAAA)</Text>
            <TextInput
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94a3b8"
              className="text-slate-800 dark:text-gray-100 text-base"
              value={dateFrom}
              onChangeText={(val) => setDateFrom(formatDateInput(val))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View className="flex-1 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3">
            <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Hasta (DD/MM/AAAA)</Text>
            <TextInput
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94a3b8"
              className="text-slate-800 dark:text-gray-100 text-base"
              value={dateTo}
              onChangeText={(val) => setDateTo(formatDateInput(val))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>
      )}

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold">Movimientos</Text>
        <Text className="text-slate-400 dark:text-gray-500 font-semibold">{filteredTransactions.length}</Text>
=======
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-slate-800 text-lg font-bold">Movimientos</Text>
        <Text className="text-slate-400 font-semibold">{filteredTransactions.length}</Text>
>>>>>>> origin/main
      </View>
    </View>
  );

  return (
<<<<<<< HEAD
    <SidebarLayout active="transacciones">
      <View className="flex-1">
        <View className="bg-[#0f172a] pt-14 pb-20 px-6 rounded-b-3xl">
          <Text className="text-white text-3xl font-bold mb-2">Transacciones</Text>
          <Text className="text-slate-400 text-base">Revisa tus movimientos</Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0f172a" />
          </View>
        ) : (
          <FlatList
            className="flex-1 px-6 pt-6"
            data={filteredTransactions}
            keyExtractor={(item, index) => String(item.id || `${item.title}-${index}`)}
            renderItem={renderTransaction}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-lg mb-2">
                  Sin movimientos
                </Text>
                <Text className="text-slate-500 dark:text-gray-400">
                  No hay transacciones para los filtros seleccionados.
                </Text>
              </View>
            }
            ListFooterComponent={<View className="h-10" />}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SidebarLayout>
=======
    <View className="flex-1 bg-gray-50">
      <View className="bg-[#0f172a] pt-14 pb-20 px-6 rounded-b-3xl">
        <TouchableOpacity className="mb-6" onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mb-2">Transacciones</Text>
        <Text className="text-slate-400 text-base">Revisa tus movimientos</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          className="flex-1 px-6 pt-6"
          data={filteredTransactions}
          keyExtractor={(item, index) => item.id || `${item.title}-${index}`}
          renderItem={renderTransaction}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-slate-200">
              <Text className="text-slate-800 font-semibold text-lg mb-2">
                Sin movimientos
              </Text>
              <Text className="text-slate-500">
                No hay transacciones para los filtros seleccionados.
              </Text>
            </View>
          }
          ListFooterComponent={<View className="h-10" />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNav active="transacciones" />
    </View>
>>>>>>> origin/main
  );
}
