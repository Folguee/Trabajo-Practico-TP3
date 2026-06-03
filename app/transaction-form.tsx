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
import { db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import {
  formatDateInput,
  parseTransactionDate,
  transactionCategories,
} from '../constants/transactions';

type TransactionType = 'income' | 'expense' | 'shared';

type SharedUser = {
  uid: string;
  docId: string;
  phone: string;
  name: string;
  email: string;
  saldo?: number;
  gastos?: number;
};

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;


export default function TransactionFormScreen() {
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const id = getParamValue(params.id);
  const initialType = getParamValue(params.type);
  const normalizedInitialType: TransactionType =
    initialType === 'income' ? 'income' : initialType === 'shared' ? 'shared' : 'expense';
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(normalizedInitialType);
  const [category, setCategory] = useState(
    initialType === 'income' ? 'Ingresos' : transactionCategories[0].name
  );
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [sharedPhone, setSharedPhone] = useState('');
  const [sharedCandidate, setSharedCandidate] = useState<SharedUser | null>(null);
  const [sharedUser, setSharedUser] = useState<SharedUser | null>(null);
  const [myShare, setMyShare] = useState('');
  const [hasTouchedMyShare, setHasTouchedMyShare] = useState(false);
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

  const handleSearchSharedUser = async () => {
    const normalizedPhone = sharedPhone.trim().toString();

    if (!normalizedPhone) {
      Alert.alert('Telefono requerido', 'Ingresa un telefono para buscar al contacto.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('telefono', '==', normalizedPhone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSharedCandidate(null);
        Alert.alert('Usuario no encontrado', 'No hay un usuario registrado con ese numero.');
        return;
      }

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();

      setSharedCandidate({
        uid: String(data.uid ?? userDoc.id),
        docId: String(userDoc.id),
        phone: String(data.telefono ?? ''),
        name: String(data.nombre ?? 'Sin nombre'),
        email: String(data.email ?? 'Sin email'),
        saldo: Number(data.saldo ?? 0),
        gastos: Number(data.gastos ?? 0),
      });
    } catch (error) {
      Alert.alert('Error de búsqueda', `No se pudo consultar Firestore: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleConfirmSharedUser = () => {
    setSharedUser(sharedCandidate);
    setSharedCandidate(null);
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

  const parsedAmount = Number(amount.replace(',', '.'));
  const parsedMyShare = Number(myShare.replace(',', '.'));
  const friendShareValue = Number.isFinite(parsedAmount) ? parsedAmount - parsedMyShare : 0;

  useEffect(() => {
    if (type !== 'shared') return;

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMyShare('0.00');
      return;
    }

    if (!hasTouchedMyShare) {
      setMyShare((parsedAmount / 2).toFixed(2));
    }
  }, [amount, hasTouchedMyShare, parsedAmount, type]);

  const handleSave = async () => {
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

    const detalleCompartido = type === 'shared' && sharedUser
      ? {
          total: parsedAmount,
          pagadoPorMi: parsedMyShare,
          pagadoPorAmigo: friendShareValue,
          amigo: {
            uid: sharedUser.uid,
            nombre: sharedUser.name,
            telefono: sharedUser.phone,
            email: sharedUser.email,
          },
        }
      : undefined;

    if (type === 'shared') {
      if (!Number.isFinite(parsedMyShare) || parsedMyShare <= 0) {
        Alert.alert('Mi parte invalida', 'Ingresa un monto valido para tu parte.');
        return;
      }

      if (friendShareValue < 0) {
        Alert.alert('Distribucion invalida', 'Tu parte no puede superar el monto total.');
        return;
      }

      if (Math.abs(parsedAmount - (parsedMyShare + friendShareValue)) > 0.0001) {
        Alert.alert('Distribucion invalida', 'La suma de las partes debe coincidir con el monto total.');
        return;
      }

      if (!sharedUser) {
        Alert.alert('Usuario compartido requerido', 'Busca primero al usuario con el que compartes el gasto.');
        return;
      }
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
      status: 'agregado',
      ...(type === 'shared'
        ? {
            creatorUid: user.uid,
            creatorNombre: user.displayName || 'Yo',
            amigoUid: sharedUser?.uid || '',
            amigoNombre: sharedUser?.name || 'Amigo',
            parteCreador: parsedMyShare,
            parteAmigo: friendShareValue,
            sharedWith: {
              uid: sharedUser?.uid || '',
              phone: sharedUser?.phone || '',
              name: sharedUser?.name || '',
              amount: friendShareValue,
            },
            detalleCompartido,
            myShare: parsedMyShare,
          }
        : {}),
    };

    try {
      setIsSaving(true);
      if (id) {
        await updateTransaction(id, payload);
        router.replace({ pathname: '/transaction-detail', params: { id } });
      } else if (type === 'shared' && sharedUser) {
        await addTransaction({
          ...payload,
          amount: -parsedMyShare,
          userId: user.uid,
          creatorUid: user.uid,
          creatorNombre: user.displayName || 'Yo',
          amigoUid: sharedUser.uid,
          amigoNombre: sharedUser.name,
          parteCreador: parsedMyShare,
          parteAmigo: friendShareValue,
          sharedWith: {
            uid: sharedUser.uid,
            phone: sharedUser.phone,
            name: sharedUser.name,
            amount: friendShareValue,
          },
          detalleCompartido,
          myShare: parsedMyShare,
        });

        await addTransaction({
          ...payload,
          amount: -friendShareValue,
          userId: sharedUser.uid,
          creatorUid: user.uid,
          creatorNombre: user.displayName || 'Yo',
          amigoUid: sharedUser.uid,
          amigoNombre: sharedUser.name,
          parteCreador: parsedMyShare,
          parteAmigo: friendShareValue,
          sharedWith: {
            uid: user.uid,
            phone: user.email || '',
            name: user.displayName || 'Usuario compartido',
            amount: parsedMyShare,
          },
          detalleCompartido,
          myShare: friendShareValue,
        });

        try {
          const friendBalance = Number(sharedUser.saldo ?? 0);
          const friendExpenses = Number(sharedUser.gastos ?? 0);
          await updateDoc(doc(db, 'users', sharedUser.docId), {
            saldo: friendBalance - friendShareValue,
            gastos: friendExpenses + friendShareValue,
          });
        } catch (updateError) {
          console.warn('No se pudo actualizar saldo del amigo:', updateError);
        }

        router.replace('/transacciones');
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
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
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
              <DollarSign size={32} color={type === 'expense' || type === 'shared' ? '#fb7185' : '#34d399'} />
              <TextInput
                className={`text-4xl font-bold tracking-tight min-w-[140px] ${
                  type === 'expense' || type === 'shared' ? 'text-rose-400' : 'text-emerald-400'
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
          <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Datos</Text>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base mb-2">Tipo</Text>
            <View className="flex-row gap-2">
              {(['expense', 'income', 'shared'] as TransactionType[]).map((item) => {
                const isActive = type === item;
                const label = item === 'expense' ? 'Gasto' : item === 'income' ? 'Ingreso' : 'Compartido';

                return (
                  <TouchableOpacity
                    key={item}
                    className={`flex-1 rounded-xl p-4 items-center ${
                      isActive ? 'bg-slate-950' : 'bg-slate-100 dark:bg-gray-700'
                    }`}
                    onPress={() => handleTypeChange(item)}
                  >
                    <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <Tag size={20} color="#0f172a" />
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Titulo</Text>
            </View>
            <TextInput
              className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100 text-base"
              placeholder="Ej: Supermercado"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {type === 'shared' ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base mb-3">Gasto Compartido</Text>

              <View className="bg-slate-50 dark:bg-gray-700 rounded-2xl p-4 mb-3 border border-slate-100 dark:border-gray-600">
                <Text className="text-slate-500 dark:text-gray-400 text-xs mb-1">Buscar por telefono</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100"
                    keyboardType="phone-pad"
                    placeholder="Ej: 1122334455"
                    placeholderTextColor="#94a3b8"
                    value={sharedPhone}
                    onChangeText={setSharedPhone}
                  />
                  <TouchableOpacity
                    className="bg-slate-950 rounded-xl px-4 py-3"
                    onPress={handleSearchSharedUser}
                  >
                    <Text className="text-white font-semibold">Buscar</Text>
                  </TouchableOpacity>
                </View>
                {sharedCandidate ? (
                  <View className="mt-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-gray-800 p-4 shadow-sm">
                    <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base mb-1">{sharedCandidate.name}</Text>
                    <Text className="text-slate-500 dark:text-gray-400 text-sm mb-3">{sharedCandidate.email}</Text>
                    <TouchableOpacity
                      className="bg-emerald-500 rounded-xl px-4 py-3 items-center"
                      onPress={handleConfirmSharedUser}
                    >
                      <Text className="text-white font-semibold">Confirmar Usuario</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {sharedUser ? (
                  <Text className="text-emerald-600 dark:text-emerald-400 text-sm mt-2">
                    Usuario confirmado: {sharedUser.name}
                  </Text>
                ) : null}
              </View>

              <View className="bg-slate-50 dark:bg-gray-700 rounded-2xl p-4 border border-slate-100 dark:border-gray-600">
                <Text className="text-slate-500 dark:text-gray-400 text-xs mb-1">Monto total</Text>
                <Text className="text-slate-800 dark:text-gray-100 text-xl font-bold mb-3">$ {Number.isFinite(parsedAmount) ? parsedAmount.toFixed(2) : '0.00'}</Text>

                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-gray-400 text-xs mb-1">Mi parte</Text>
                  <TextInput
                    className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100"
                    keyboardType="decimal-pad"
                    value={myShare}
                    onChangeText={(value) => {
                      setHasTouchedMyShare(true);
                      setMyShare(value.replace(/[^\d.,]/g, ''));
                    }}
                  />
                </View>

                <View>
                  <Text className="text-slate-500 dark:text-gray-400 text-xs mb-1">Parte de {sharedUser?.name || 'amigo'}</Text>
                  <TextInput
                    className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100"
                    keyboardType="decimal-pad"
                    value={Number.isFinite(friendShareValue) ? friendShareValue.toFixed(2) : '0.00'}
                    editable={false}
                  />
                </View>
              </View>
            </View>
          ) : null}

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <Calendar size={20} color={dateError ? '#ef4444' : '#0f172a'} />
              <Text className={`font-semibold text-base ml-2 ${dateError ? 'text-rose-500' : 'text-slate-800 dark:text-gray-100'}`}>
                Fecha
              </Text>
            </View>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                className={`bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100 text-base ${
                  dateError ? 'border-rose-400' : 'border-slate-100 dark:border-gray-600'
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

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base mb-3">Categoria</Text>
            {transactionCategories
              .filter((item) => (type === 'income' ? item.name === 'Ingresos' : item.name !== 'Ingresos'))
              .map((item) => {
                const Icon = item.icon;
                const isSelected = item.name === category;

                return (
                  <TouchableOpacity
                    key={item.name}
                    className={`rounded-2xl p-4 flex-row items-center justify-between mb-3 ${
                      isSelected ? 'bg-slate-950' : 'bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600'
                    }`}
                    onPress={() => setCategory(item.name)}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`${item.bgColor} w-12 h-12 rounded-full items-center justify-center`}>
                        <Icon size={24} color={item.iconColor} />
                      </View>
                      <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-slate-800 dark:text-gray-100'}`}>
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color="white" />}
                  </TouchableOpacity>
                );
              })}
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <FileText size={20} color="#0f172a" />
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Nota</Text>
            </View>
            <TextInput
              className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100 text-base min-h-[96px]"
              multiline
              placeholder="Detalle opcional"
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Camera size={20} color="#0f172a" />
                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Foto</Text>
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
              <View className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-2xl h-32 items-center justify-center">
                <Camera size={28} color="#94a3b8" />
                <Text className="text-slate-400 dark:text-gray-500 mt-2">Sin imagen adjunta</Text>
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
