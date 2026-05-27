import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  DollarSign,
  FileText,
  Tag,
} from 'lucide-react-native';
import {
  addTransaction,
  getTransactionById,
  Transaction,
  updateTransaction,
} from '../services/transaction.service';
import { useAuthStore } from '../store/authStore';
import {
  formatDateInput,
  parseTransactionDate,
  transactionCategories,
} from '../constants/transactions';

type TransactionType = 'income' | 'expense';

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function TransactionFormScreen() {
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const id = getParamValue(params.id);
  const initialType = getParamValue(params.type) === 'income' ? 'income' : 'expense';
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [category, setCategory] = useState(
    initialType === 'income' ? 'Ingresos' : transactionCategories[0].name
  );
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [dateError, setDateError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const loadTransaction = useCallback(async () => {
    if (!id) return;

    const transaction = await getTransactionById(id);
    if (!transaction) {
      Alert.alert('No encontrado', 'El movimiento ya no existe.');
      router.replace('/transacciones');
      return;
    }

    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setCategory(transaction.category || 'Alimentacion');
    setDate(transaction.date || '');
    setNote(transaction.note || '');
    setPhotoUri(transaction.photoUri || '');
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === 'income' ? 'Ingresos' : 'Alimentacion');
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para adjuntar una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri || '');
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDateChange = (value: string) => {
    const formatted = formatDateInput(value);
    setDate(formatted);

    if (formatted.length === 10) {
      if (!parseTransactionDate(formatted)) {
        setDateError('Fecha invalida');
        triggerShake();
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!title.trim() || !amount.trim() || !category || !date.trim()) {
      Alert.alert('Datos incompletos', 'Completa titulo, monto, tipo, categoria y fecha.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto invalido', 'Ingresa un monto mayor a cero.');
      return;
    }

    if (!parseTransactionDate(date.trim())) {
      Alert.alert('Fecha invalida', 'Ingresa una fecha valida en formato DD/MM/AAAA.');
      return;
    }

    if (!user) {
      Alert.alert('Sesion requerida', 'Inicia sesion para guardar el movimiento.');
      router.replace('/login');
      return;
    }

    const payload: Omit<Transaction, 'id'> = {
      title: title.trim(),
      amount: parsedAmount,
      type,
      category,
      date: date.trim(),
      note: note.trim(),
      photoUri,
      userId: user.uid,
    };

    try {
      setIsSaving(true);
      if (id) {
        await updateTransaction(id, payload);
        router.replace({ pathname: '/transaction-detail', params: { id } });
      } else {
        await addTransaction(payload);
        router.replace('/transacciones');
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar el movimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
          <TouchableOpacity className="mb-6" onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold mb-2">
            {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </Text>
          <Text className="text-slate-400 text-base">Completa los datos de la transaccion</Text>
        </View>

        <View className="px-6 -mt-16">
          <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20">
            <Text className="text-white text-lg font-bold mb-2">Monto</Text>
            <View className="flex-row items-center justify-center">
              <DollarSign size={32} color={type === 'expense' ? '#fb7185' : '#34d399'} />
              <TextInput
                className={`text-4xl font-bold tracking-tight min-w-[140px] ${
                  type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                }`}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-slate-800 text-lg font-bold mb-4">Datos</Text>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <Text className="text-slate-800 font-semibold text-base mb-2">Tipo</Text>
            <View className="flex-row gap-2">
              {(['expense', 'income'] as TransactionType[]).map((item) => {
                const isActive = type === item;
                const label = item === 'expense' ? 'Gasto' : 'Ingreso';

                return (
                  <TouchableOpacity
                    key={item}
                    className={`flex-1 rounded-xl p-4 items-center ${
                      isActive ? 'bg-slate-950' : 'bg-slate-100'
                    }`}
                    onPress={() => handleTypeChange(item)}
                  >
                    <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <Tag size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Titulo</Text>
            </View>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-base"
              placeholder="Ej: Supermercado"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <Calendar size={20} color={dateError ? '#ef4444' : '#0f172a'} />
              <Text className={`font-semibold text-base ml-2 ${dateError ? 'text-rose-500' : 'text-slate-800'}`}>
                Fecha
              </Text>
            </View>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                className={`bg-slate-50 border rounded-xl px-4 py-3 text-slate-800 text-base ${
                  dateError ? 'border-rose-400' : 'border-slate-100'
                }`}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
                value={date}
                onChangeText={handleDateChange}
              />
            </Animated.View>
            {dateError ? (
              <Animated.Text className="text-rose-500 text-sm mt-1 ml-1">
                {dateError}
              </Animated.Text>
            ) : null}
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <Text className="text-slate-800 font-semibold text-base mb-3">Categoria</Text>
            {transactionCategories
              .filter((item) => (type === 'income' ? item.name === 'Ingresos' : item.name !== 'Ingresos'))
              .map((item) => {
                const Icon = item.icon;
                const isSelected = item.name === category;

                return (
                  <TouchableOpacity
                    key={item.name}
                    className={`rounded-2xl p-4 flex-row items-center justify-between mb-3 ${
                      isSelected ? 'bg-slate-950' : 'bg-slate-50 border border-slate-100'
                    }`}
                    onPress={() => setCategory(item.name)}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`${item.bgColor} w-12 h-12 rounded-full items-center justify-center`}>
                        <Icon size={24} color={item.iconColor} />
                      </View>
                      <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color="white" />}
                  </TouchableOpacity>
                );
              })}
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <FileText size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Nota</Text>
            </View>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-base min-h-[96px]"
              multiline
              placeholder="Detalle opcional"
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Camera size={20} color="#0f172a" />
                <Text className="text-slate-800 font-semibold text-base ml-2">Foto</Text>
              </View>
              <TouchableOpacity
                className="bg-slate-950 rounded-xl px-4 py-2"
                onPress={handlePickPhoto}
              >
                <Text className="text-white font-semibold">Elegir</Text>
              </TouchableOpacity>
            </View>
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-full h-48 rounded-2xl" />
            ) : (
              <View className="bg-slate-50 border border-slate-100 rounded-2xl h-32 items-center justify-center">
                <Camera size={28} color="#94a3b8" />
                <Text className="text-slate-400 mt-2">Sin imagen adjunta</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-6 mt-8 mb-10">
          <TouchableOpacity
            className={`rounded-xl p-4 flex-row items-center justify-center gap-2 ${
              isSaving ? 'bg-slate-400' : 'bg-[#0f172a]'
            }`}
            disabled={isSaving}
            onPress={handleSave}
          >
            {isSaving ? <ActivityIndicator color="white" /> : <Check size={20} color="white" />}
            <Text className="text-white font-semibold text-base">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
