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
  Modal,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  CalendarDays,
  Filter,
  Plus,
  Search,
  Calendar,
  FileText,
  Tag,
  Trash2,
  Pencil,
  X,
  Download,
} from 'lucide-react-native';
import SidebarLayout from '../components/SidebarLayout';
import { getTransactions, Transaction, deleteTransaction } from '../services/transaction.service';
import {
  getCategoryConfig,
} from '../constants/transactions';
import TransactionFormSheet from '../components/TransactionFormSheet';
import { formatCurrency } from '../utils/money';
import {
  endOfDay,
  formatDateInput,
  formatDisplayDate,
  isInCurrentMonth,
  isSameDay,
  parseDateInput,
} from '../utils/date';
import { getCategories } from '../services/category.service';
import type { Category } from '../types';
import SharedExpenseDetail from '../components/SharedExpenseDetail';
import { useAuthStore } from '../store/authStore';

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
  return formatCurrency(transaction.amount, {
    sign: isExpense ? 'negative' : 'positive',
  });
};

export default function Transacciones() {
  const currentUser = useAuthStore((state) => state.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTxId, setFormTxId] = useState<string | null>(null);

  const handleDeleteSelected = async () => {
    if (!selectedTx?.id) return;
    
    const isWeb = typeof window !== 'undefined';
    const confirmed = isWeb
      ? window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.')
      : await new Promise<boolean>(resolve => {
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
        error instanceof Error ? error.message : 'No se pudieron cargar los movimientos.'
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

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const fromDate = dateFilter === 'custom' && dateFrom ? parseDateInput(dateFrom) : null;
    const toDate = dateFilter === 'custom' && dateTo ? parseDateInput(dateTo) : null;

    return transactions.filter((transaction) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        transaction.categoryName.toLowerCase().includes(normalizedSearch) ||
        transaction.note?.toLowerCase().includes(normalizedSearch);
      const matchesType =
        typeFilter === 'all' ||
        transaction.type === typeFilter ||
        (typeFilter === 'expense' && transaction.type === 'shared');
      const matchesCategory =
        categoryFilter === 'Todas' || transaction.categoryId === categoryFilter;
      const transactionDate = transaction.date;
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' &&
          isSameDay(transactionDate, today)) ||
        (dateFilter === 'month' &&
          isInCurrentMonth(transactionDate, today)) ||
        (dateFilter === 'custom' &&
          (!fromDate || transactionDate >= fromDate) &&
          (!toDate || transactionDate <= endOfDay(toDate)));

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
    const category = getCategoryConfig(
      categories.find((entry) => entry.id === item.categoryId) ||
        item.categoryName
    );
    const Icon = category.icon;
    const isExpense = item.type === 'expense' || item.type === 'shared';

    return (
      <TouchableOpacity
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700"
        onPress={() => {
          setSelectedTx(item);
          setIsDetailOpen(true);
        }}
      >
        <View className="flex-row items-center gap-4 flex-1">
          <View className={`${category.bgColor} w-12 h-12 rounded-full items-center justify-center`}>
            <Icon size={24} color={category.iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{formatDisplayDate(item.date)}</Text>
          </View>
        </View>
        <View className="items-end ml-3">
          <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} font-bold text-base`}>
            {formatAmount(item)}
          </Text>
          <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">{item.categoryName}</Text>
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
          onPress={() => {
            setFormTxId(null);
            setIsFormOpen(true);
          }}
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
          {[{ id: 'Todas', name: 'Todas' }, ...categories].map((category) => {
            const isActive = categoryFilter === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                className={`px-4 py-2 rounded-full ${isActive ? 'bg-slate-950' : 'bg-slate-200/60 dark:bg-gray-700'}`}
                onPress={() => setCategoryFilter(category.id)}
              >
                <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
                  {category.name}
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

      {/* Modal Bottom Sheet para detalles de movimiento */}
      <Modal
        visible={isDetailOpen && selectedTx !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-end md:justify-center md:items-center"
          onPress={() => setIsDetailOpen(false)}
        >
          <Pressable 
            className="bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pb-8 pt-2 max-h-[85%] border-t border-slate-200 dark:border-slate-800 md:max-w-xl md:w-full md:rounded-3xl md:shadow-2xl md:border flex flex-col"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Barra superior de arrastre */}
            <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 mt-1" />
            
            {selectedTx && (() => {
              const category = getCategoryConfig(
                categories.find((entry) => entry.id === selectedTx.categoryId) ||
                  selectedTx.categoryName
              );
              const Icon = category.icon;
              const isExpense = selectedTx.type === 'expense' || selectedTx.type === 'shared';
              const isShared = selectedTx.type === 'shared';
              const canManage =
                !isShared || selectedTx.creatorUid === currentUser?.uid;

              return (
                <View className="w-full flex-1 flex flex-col">
                  {/* Encabezado del Modal */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-slate-800 dark:text-slate-100 text-lg font-bold">Detalle del Movimiento</Text>
                    <TouchableOpacity 
                      className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
                      onPress={() => setIsDetailOpen(false)}
                    >
                      <X size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
                    {/* Tarjeta de Resumen */}
                    <View className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 items-center border border-slate-100 dark:border-slate-800 mb-6">
                      <View className={`${category.bgColor} w-16 h-16 rounded-full items-center justify-center mb-3`}>
                        <Icon size={28} color={category.iconColor} />
                      </View>
                      <Text className="text-slate-800 dark:text-slate-100 text-xl font-bold text-center mb-1">
                        {selectedTx.title}
                      </Text>
                      <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} text-3xl font-extrabold`}>
                        {formatCurrency(selectedTx.amount, {
                          sign: isExpense ? 'negative' : 'positive',
                        })}
                      </Text>
                    </View>

                    {/* Fila: Categoría */}
                    <View className="flex-row items-center gap-3.5 mb-3 px-1">
                      <View className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                        <Tag size={18} color="#64748b" />
                      </View>
                      <View>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs">Tipo y Categoría</Text>
                        <Text className="text-slate-800 dark:text-slate-100 font-semibold text-sm">
                          {isShared ? 'Compartido' : isExpense ? 'Gasto' : 'Ingreso'} - {selectedTx.categoryName}
                        </Text>
                      </View>
                    </View>

                    {/* Fila: Fecha */}
                    <View className="flex-row items-center gap-3.5 mb-3 px-1">
                      <View className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                        <Calendar size={18} color="#64748b" />
                      </View>
                      <View>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs">Fecha</Text>
                        <Text className="text-slate-800 dark:text-slate-100 font-semibold text-sm">
                          {formatDisplayDate(selectedTx.date)}
                        </Text>
                      </View>
                    </View>

                    {/* Fila: Notas */}
                    <View className="flex-row items-start gap-3.5 mb-3 px-1">
                      <View className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                        <FileText size={18} color="#64748b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-400 dark:text-slate-500 text-xs">Nota</Text>
                        <Text className="text-slate-700 dark:text-slate-300 text-sm mt-0.5 leading-relaxed">
                          {selectedTx.note || 'Sin nota cargada.'}
                        </Text>
                      </View>
                    </View>

                    {/* Detalle Compartido */}
                    <SharedExpenseDetail
                      transaction={selectedTx}
                      currentUserUid={currentUser?.uid}
                    />

                    {/* Imagen adjunta */}
                    {selectedTx.imageUrl && (
                      <View className="mt-2 mb-4 px-1">
                        <Text className="text-slate-400 dark:text-slate-500 text-xs mb-2">Imagen Adjunta</Text>
                        <Image source={{ uri: selectedTx.imageUrl }} className="w-full h-40 rounded-2xl border border-slate-100 dark:border-slate-800" />
                      </View>
                    )}
                  </ScrollView>

                  {/* Acciones del Modal */}
                  <View className="flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {canManage ? (
                      <TouchableOpacity
                        className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                        onPress={() => {
                          setIsDetailOpen(false);
                          setFormTxId(selectedTx.id);
                          setIsFormOpen(true);
                        }}
                      >
                        <Pencil size={16} color="#475569" />
                        <Text className="text-slate-700 dark:text-slate-350 font-bold text-sm">Editar</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                      onPress={() => {
                        setIsDetailOpen(false);
                        router.push({ pathname: '/exportar', params: { transactionId: selectedTx.id } });
                      }}
                    >
                      <Download size={16} color="#475569" />
                      <Text className="text-slate-700 dark:text-slate-350 font-bold text-sm">Exportar</Text>
                    </TouchableOpacity>

                    {canManage ? (
                      <TouchableOpacity
                        className="bg-rose-500 active:bg-rose-600 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                        onPress={handleDeleteSelected}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Trash2 size={16} color="white" />
                            <Text className="text-white font-bold text-sm">Eliminar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      <TransactionFormSheet
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        transactionId={formTxId}
        onSaveSuccess={loadTransactions}
      />
    </SidebarLayout>
  );
}
