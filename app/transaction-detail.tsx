import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Image as ImageIcon,
  Pencil,
  Tag,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import {
  deleteTransaction,
  getTransactionById,
  Transaction,
} from '../services/transaction.service';
import { getCategoryConfig } from '../constants/transactions';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/money';

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams();
  const currentUser = useAuthStore((state) => state.user);
  const id = getParamValue(params.id);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransaction = useCallback(async () => {
    if (!id) {
      router.replace('/transacciones');
      return;
    }

    const result = await getTransactionById(id);
    setTransaction(result);
    setIsLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTransaction();
    }, [loadTransaction])
  );

  const handleDelete = async () => {
    if (!id) {
      Alert.alert('Error', 'No se pudo identificar el movimiento. ID inválido.');
      return;
    }

    if (isDeleting) {
      return;
    }

    // Usar window.confirm en web, Alert.alert en mobile
    const isWeb = typeof window !== 'undefined';
    const confirmed = isWeb
      ? window.confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.')
      : await new Promise<boolean>(resolve => {
        Alert.alert(
          'Eliminar movimiento',
          'Esta acción no se puede deshacer.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ],
          { cancelable: false }
        );
      });

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteTransaction(id);

      // Esperar un poco antes de navegar
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push('/dashboard');
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        'Error al eliminar',
        `${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-6">
        <Text className="text-slate-800 dark:text-gray-100 text-xl font-bold mb-2">Movimiento no encontrado</Text>
        <TouchableOpacity className="bg-slate-950 rounded-xl px-5 py-3" onPress={() => router.replace('/transacciones')}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = getCategoryConfig(transaction.category);
  const Icon = category.icon;
  const isExpense = transaction.type === 'expense' || transaction.type === 'shared';
  const currentUserId = currentUser?.uid;
  const myShare = Number(
    currentUserId === transaction.creatorUid
      ? transaction.parteCreador ?? 0
      : transaction.parteAmigo ?? 0
  );
  const sharedTotal = transaction.detalleCompartido?.total ?? 0;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/transaction-form', params: { id } })}
              >
                <Pencil size={23} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete()}
                disabled={isDeleting}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Trash2 size={23} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Text className="text-white text-3xl font-bold mb-2">Detalle</Text>
          <Text className="text-slate-400 text-base">Datos completos del movimiento</Text>
        </View>

        <View className="px-6 -mt-16">
          <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20 items-center">
            <View className={`${category.bgColor} w-20 h-20 rounded-full items-center justify-center mb-4`}>
              <Icon size={36} color={category.iconColor} />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              {transaction.title}
            </Text>
            <Text className={`${isExpense ? 'text-rose-400' : 'text-emerald-400'} text-4xl font-bold`}>
              {formatCurrency(transaction.amount, {
                sign: isExpense ? 'negative' : 'positive',
              })}
            </Text>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Informacion</Text>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="bg-slate-100 dark:bg-gray-700 w-12 h-12 rounded-full items-center justify-center mr-4">
              <Tag size={22} color="#0f172a" />
            </View>
            <View>
              <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Tipo y categoria</Text>
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">
                {transaction.type === 'shared' ? 'Compartido' : isExpense ? 'Gasto' : 'Ingreso'} - {transaction.category || 'Sin categoria'}
              </Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="bg-slate-100 dark:bg-gray-700 w-12 h-12 rounded-full items-center justify-center mr-4">
              <Calendar size={22} color="#0f172a" />
            </View>
            <View>
              <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Fecha</Text>
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">
                {transaction.date || 'Sin fecha'}
              </Text>
            </View>
          </View>

          {transaction.type === 'shared' && transaction.detalleCompartido ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
              <View className="flex-row items-center mb-3">
                <Wallet size={22} color="#0f172a" />
                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Detalle compartido</Text>
              </View>
              <Text className="text-slate-500 dark:text-gray-400 text-sm mb-2">Monto total original</Text>
              <Text className="text-slate-800 dark:text-gray-100 font-bold text-xl mb-4">
                {formatCurrency(sharedTotal)}
              </Text>
              <View className="bg-slate-50 dark:bg-gray-700 rounded-2xl p-3 border border-slate-100 dark:border-gray-600">
                <Text className="text-slate-700 dark:text-gray-200 text-sm mb-2">
                  Pagado por mí: {formatCurrency(transaction.detalleCompartido.pagadoPorMi)}
                </Text>
                <Text className="text-slate-700 dark:text-gray-200 text-sm">
                  Pagado por {transaction.detalleCompartido.amigo?.nombre || 'Amigo'}:{' '}
                  {formatCurrency(transaction.detalleCompartido.pagadoPorAmigo)}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-3">
              <FileText size={22} color="#0f172a" />
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Nota</Text>
            </View>
            <Text className="text-slate-500 dark:text-gray-400">
              {transaction.note || 'Sin nota cargada.'}
            </Text>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-10 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-3">
              <ImageIcon size={22} color="#0f172a" />
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Imagen</Text>
            </View>
            {transaction.imageUrl ? (
              <Image source={{ uri: transaction.imageUrl }} className="w-full h-56 rounded-2xl" />
            ) : (
              <View className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-2xl h-32 items-center justify-center">
                <ImageIcon size={28} color="#94a3b8" />
                <Text className="text-slate-400 dark:text-gray-500 mt-2">Sin imagen adjunta</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-[#0f172a] rounded-xl p-4 mt-6 mb-8"
            onPress={() =>
              router.push({
                pathname: "/exportar",
                params: {
                  transactionId: transaction.id
                }
              })
            }
          >

            <Text className="text-white text-center font-semibold">
              Exportar CSV
            </Text>

          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
