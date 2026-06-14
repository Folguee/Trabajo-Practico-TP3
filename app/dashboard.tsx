import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getTransactions, Transaction, deleteTransaction } from '../services/transaction.service';
import { getCategoryConfig, parseTransactionDate } from '../constants/transactions';
import {
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  FileText,
  Tag,
  Trash2,
  Pencil,
  X,
  Download,
} from 'lucide-react-native';
import SidebarLayout from '../components/SidebarLayout';
import { LinearGradient } from 'expo-linear-gradient';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransactions = useCallback(async () => {
    const result = await getTransactions();
    setTransactions(result);
    setIsLoading(false);
  }, []);

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
      recentTransactions: sorted.slice(0, 4),
    };
  }, [transactions]);

  const balance = totalIncome - totalExpense;
  const hasTransactions = transactions.length > 0;

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
        onPress={() => router.push('/transaction-form')}
      >
        <Plus size={18} color="white" />
        <Text className="text-white font-semibold">Registrar movimiento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentTransaction = (item: Transaction) => {
    const category = getCategoryConfig(item.category);
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
            <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">{item.date || 'Sin fecha'}</Text>
          </View>
        </View>
        <View className="items-end ml-3">
          <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} font-bold text-sm`}>
            {isExpense ? '-' : '+'}${item.amount.toFixed(2)}
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">{item.category || 'Sin categoría'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonTransaction = (key: number) => (
    <View key={key} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm opacity-60">
      <View className="flex-row items-center gap-4 flex-1">
        <View className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <View className="flex-1 gap-2">
          <View className="h-4 w-28 bg-slate-200 dark:bg-slate-850 rounded animate-pulse" />
          <View className="h-3 w-16 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
        </View>
      </View>
      <View className="items-end gap-2 ml-3">
        <View className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <View className="h-3 w-12 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
      </View>
    </View>
  );

  return (
    <SidebarLayout active="dashboard">
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cabecera / Banner superior - Consistente con las demás pantallas (Sólido Navy #0f172a) */}
          <View className="bg-[#0f172a] pt-16 pb-28 px-6 rounded-b-[32px] md:pt-14 md:pb-24 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-3xl font-bold mb-1 tracking-tight">Control de Gastos</Text>
                <Text className="text-slate-400 text-sm">Gestiona tus finanzas personales</Text>
              </View>
              <View className="bg-slate-800/80 p-2.5 rounded-full border border-slate-700/50 hidden md:flex">
                <Sparkles size={20} color="#818cf8" />
              </View>
            </View>
          </View>

          {/* Tarjeta de Saldos principal (Sólida sin degradados, flotando sobre el banner) */}
          <View className="px-6 -mt-16">
            <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl min-h-[160px] justify-center">
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Resumen de Saldos</Text>
              {isLoading ? (
                <View className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg my-1 animate-pulse" />
              ) : (
                <Text className={`text-4xl font-extrabold tracking-tight mb-6 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ${balance.toFixed(2)}
                </Text>
              )}

              <View className="flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <View className="flex-1 items-center border-r border-slate-100 dark:border-slate-800">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <ArrowUpRight size={14} color="#10b981" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Ingresos</Text>
                  </View>
                  {isLoading ? (
                    <View className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded my-1 animate-pulse" />
                  ) : (
                    <Text className="text-emerald-500 font-bold text-sm">+ ${totalIncome.toFixed(2)}</Text>
                  )}
                </View>
                <View className="flex-1 items-center">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <ArrowDownLeft size={14} color="#f43f5e" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gastos</Text>
                  </View>
                  {isLoading ? (
                    <View className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded my-1 animate-pulse" />
                  ) : (
                    <Text className="text-rose-500 font-bold text-sm">- ${totalExpense.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Acciones Rápidas */}
          <View className="px-6 mt-8">
            <Text className="text-slate-800 dark:text-slate-200 text-lg font-bold mb-3">Acciones Rápidas</Text>
            <TouchableOpacity
              className="bg-[#0f172a] active:bg-slate-800 rounded-2xl p-4 flex-row items-center justify-center gap-2 shadow-md"
              onPress={() => router.push('/transaction-form')}
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
                    onPress={() => router.push('/transacciones')}
                    className="flex-row items-center gap-1 active:opacity-75"
                  >
                    <Text className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">Ver todas</Text>
                    <ChevronRight size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>

                {recentTransactions.map(renderRecentTransaction)}

                <TouchableOpacity 
                  onPress={() => router.push("/exportar")} 
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
            className="bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pb-8 pt-2 max-h-[85%] border-t border-slate-200 dark:border-slate-800 md:max-w-xl md:w-full md:rounded-3xl md:shadow-2xl md:border"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Barra superior de arrastre */}
            <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 mt-1" />
            
            {selectedTx && (() => {
              const category = getCategoryConfig(selectedTx.category);
              const Icon = category.icon;
              const isExpense = selectedTx.type === 'expense' || selectedTx.type === 'shared';
              const isShared = selectedTx.type === 'shared';
              const sharedFriends = selectedTx.detalleCompartido?.amigos ?? [];
              const sharedTotal = selectedTx.detalleCompartido?.total ?? 0;

              return (
                <View className="w-full">
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

                  <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                    {/* Tarjeta de Resumen */}
                    <View className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 items-center border border-slate-100 dark:border-slate-800 mb-6">
                      <View className={`${category.bgColor} w-16 h-16 rounded-full items-center justify-center mb-3`}>
                        <Icon size={28} color={category.iconColor} />
                      </View>
                      <Text className="text-slate-800 dark:text-slate-100 text-xl font-bold text-center mb-1">
                        {selectedTx.title}
                      </Text>
                      <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} text-3xl font-extrabold`}>
                        {isExpense ? '-' : '+'} ${selectedTx.amount.toFixed(2)}
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
                          {isShared ? 'Compartido' : isExpense ? 'Gasto' : 'Ingreso'} - {selectedTx.category || 'Sin categoría'}
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
                          {selectedTx.date || 'Sin fecha'}
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
                    {isShared && (
                      <View className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
                        <Text className="text-slate-800 dark:text-slate-100 font-bold text-sm mb-2">Detalle Compartido</Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Original</Text>
                        <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-3">
                          ${sharedTotal.toFixed(2)}
                        </Text>
                        {sharedFriends.length > 0 && (
                          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl gap-1.5">
                            {sharedFriends.map((friend) => (
                              <Text key={friend.uid || friend.nombre} className="text-slate-700 dark:text-slate-300 text-xs">
                                Pagado por {friend.nombre}: <Text className="font-bold">${Number(friend.amount).toFixed(2)}</Text>
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Imagen adjunta */}
                    {selectedTx.photoUri && (
                      <View className="mt-2 mb-4 px-1">
                        <Text className="text-slate-400 dark:text-slate-500 text-xs mb-2">Imagen Adjunta</Text>
                        <Image source={{ uri: selectedTx.photoUri }} className="w-full h-40 rounded-2xl border border-slate-100 dark:border-slate-800" />
                      </View>
                    )}
                  </ScrollView>

                  {/* Acciones del Modal */}
                  <View className="flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <TouchableOpacity
                      className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                      onPress={() => {
                        setIsDetailOpen(false);
                        router.push({ pathname: '/transaction-form', params: { id: selectedTx.id } });
                      }}
                    >
                      <Pencil size={16} color="#475569" />
                      <Text className="text-slate-700 dark:text-slate-350 font-bold text-sm">Editar</Text>
                    </TouchableOpacity>

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
                  </View>
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </SidebarLayout>
  );
}
