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
} from 'lucide-react-native';
import {
  deleteTransaction,
  getTransactionById,
  Transaction,
} from '../services/transaction.service';
import { getCategoryConfig } from '../constants/transactions';

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams();
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

  const handleDelete = () => {
    if (!id) return;

    Alert.alert('Eliminar movimiento', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            await deleteTransaction(id);
            router.replace('/transacciones');
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el movimiento.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-slate-800 text-xl font-bold mb-2">Movimiento no encontrado</Text>
        <TouchableOpacity className="bg-slate-950 rounded-xl px-5 py-3" onPress={() => router.replace('/transacciones')}>
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = getCategoryConfig(transaction.category);
  const Icon = category.icon;
  const isExpense = transaction.type === 'expense';

  return (
    <View className="flex-1 bg-gray-50">
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
              <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
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
              {isExpense ? '-' : '+'} ${transaction.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-slate-800 text-lg font-bold mb-4">Informacion</Text>

          <View className="bg-white rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200">
            <View className="bg-slate-100 w-12 h-12 rounded-full items-center justify-center mr-4">
              <Tag size={22} color="#0f172a" />
            </View>
            <View>
              <Text className="text-slate-400 text-xs mb-1">Tipo y categoria</Text>
              <Text className="text-slate-800 font-semibold text-base">
                {isExpense ? 'Gasto' : 'Ingreso'} - {transaction.category || 'Sin categoria'}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200">
            <View className="bg-slate-100 w-12 h-12 rounded-full items-center justify-center mr-4">
              <Calendar size={22} color="#0f172a" />
            </View>
            <View>
              <Text className="text-slate-400 text-xs mb-1">Fecha</Text>
              <Text className="text-slate-800 font-semibold text-base">
                {transaction.date || 'Sin fecha'}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-3">
              <FileText size={22} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Nota</Text>
            </View>
            <Text className="text-slate-500">
              {transaction.note || 'Sin nota cargada.'}
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-10 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-3">
              <ImageIcon size={22} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Imagen</Text>
            </View>
            {transaction.photoUri ? (
              <Image source={{ uri: transaction.photoUri }} className="w-full h-56 rounded-2xl" />
            ) : (
              <View className="bg-slate-50 border border-slate-100 rounded-2xl h-32 items-center justify-center">
                <ImageIcon size={28} color="#94a3b8" />
                <Text className="text-slate-400 mt-2">Sin imagen adjunta</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
