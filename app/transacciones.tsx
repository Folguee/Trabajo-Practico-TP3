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
  CalendarDays,
  Filter,
  Plus,
  Search,
} from 'lucide-react-native';
import SidebarLayout from '../components/SidebarLayout';
import { getTransactions, Transaction } from '../services/transaction.service';
import {
  formatDateInput,
  getCategoryConfig,
  parseTransactionDate,
  transactionCategories,
} from '../constants/transactions';

type TypeFilter = 'all' | 'income' | 'expense';
type DateFilter = 'all' | 'today' | 'month' | 'custom';

const typeFilters: Array<{ label: string; value: TypeFilter }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' },
];

const dateFilters: Array<{ label: string; value: DateFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Este mes', value: 'month' },
  { label: 'Personalizado', value: 'custom' },
];

const formatAmount = (transaction: Transaction) => {
  const isExpense = transaction.type === 'expense' || transaction.type === 'shared';
  const sign = isExpense ? '-' : '+';
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
    const fromDate = dateFilter === 'custom' && dateFrom ? parseTransactionDate(dateFrom) : null;
    const toDate = dateFilter === 'custom' && dateTo ? parseTransactionDate(dateTo) : null;

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
          transactionDate.getFullYear() === today.getFullYear()) ||
        (dateFilter === 'custom' &&
          transactionDate !== null &&
          (!fromDate || transactionDate >= fromDate) &&
          (!toDate || transactionDate <= toDate));

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [categoryFilter, dateFilter, search, transactions, typeFilter, dateFrom, dateTo]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  const renderSkeletonTransaction = (key: number) => (
    <View key={key} className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 opacity-60">
      <View className="flex-row items-center gap-4 flex-1">
        <View className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <View className="flex-1 gap-2">
          <View className="h-4.5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <View className="h-3 w-20 bg-slate-100 dark:bg-slate-700/60 rounded animate-pulse" />
        </View>
      </View>
      <View className="items-end gap-2 ml-3">
        <View className="h-4.5 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <View className="h-3 w-16 bg-slate-100 dark:bg-slate-700/60 rounded animate-pulse" />
      </View>
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategoryConfig(item.category);
    const Icon = category.icon;
    const isExpense = item.type === 'expense' || item.type === 'shared';

    return (
      <TouchableOpacity
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700"
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
            <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{item.date || 'Sin fecha'}</Text>
          </View>
        </View>
        <View className="items-end ml-3">
          <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} font-bold text-base`}>
            {formatAmount(item)}
          </Text>
          <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{item.category || 'Sin categoria'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View>
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-6 flex-row gap-3">
        <View className="flex-1 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3 flex-row items-center gap-2">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Buscar movimiento..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-800 dark:text-gray-100 text-base"
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
        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold">Filtros</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {typeFilters.map((filter) => {
            const isActive = typeFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'}`}
                onPress={() => setTypeFilter(filter.value)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
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
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'}`}
                onPress={() => setCategoryFilter(category)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {dateFilters.map((filter) => {
            const isActive = dateFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                  isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'
                }`}
                onPress={() => setDateFilter(filter.value)}
              >
                <CalendarDays size={16} color={isActive ? 'white' : '#475569'} />
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
        {isLoading ? (
          <View className="h-5 w-8 bg-slate-250 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <Text className="text-slate-400 dark:text-gray-500 font-semibold">{filteredTransactions.length}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SidebarLayout active="transacciones">
      <View className="flex-1">
        <View className="bg-[#0f172a] pt-16 pb-24 px-6 rounded-b-[32px] md:pt-14 md:pb-20 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-3xl font-extrabold tracking-tight mb-1">Transacciones</Text>
              <Text className="text-slate-400 text-sm">Revisa tus movimientos y gastos</Text>
            </View>
            <View className="bg-slate-800/80 p-2.5 rounded-full border border-slate-700/50 hidden md:flex">
              <Filter size={20} color="#818cf8" />
            </View>
          </View>
        </View>

        <FlatList
          className="flex-1 px-6 pt-6"
          data={isLoading ? [] : filteredTransactions}
          keyExtractor={(item, index) => String(item.id || `${item.title}-${index}`)}
          renderItem={renderTransaction}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            isLoading ? (
              <View>
                {[1, 2, 3, 4].map(renderSkeletonTransaction)}
              </View>
            ) : (
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-lg mb-2">
                  Sin movimientos
                </Text>
                <Text className="text-slate-500 dark:text-gray-400">
                  No hay transacciones para los filtros seleccionados.
                </Text>
              </View>
            )
          }
          ListFooterComponent={<View className="h-10" />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SidebarLayout>
  );
}
