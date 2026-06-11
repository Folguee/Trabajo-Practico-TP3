<<<<<<< HEAD
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
=======
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
import { useAuthStore } from '../store/authStore';
import {
  formatDateInput,
  transactionCategories,
} from '../constants/transactions';

type TransactionType = 'income' | 'expense';
>>>>>>> origin/main

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

<<<<<<< HEAD

=======
>>>>>>> origin/main
export default function TransactionFormScreen() {
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const id = getParamValue(params.id);
<<<<<<< HEAD
  const initialType = getParamValue(params.type);
  const normalizedInitialType: TransactionType =
    initialType === 'income' ? 'income' : initialType === 'shared' ? 'shared' : 'expense';
=======
  const initialType = getParamValue(params.type) === 'income' ? 'income' : 'expense';
>>>>>>> origin/main
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
<<<<<<< HEAD
  const [type, setType] = useState<TransactionType>(normalizedInitialType);
=======
  const [type, setType] = useState<TransactionType>(initialType);
>>>>>>> origin/main
  const [category, setCategory] = useState(
    initialType === 'income' ? 'Ingresos' : transactionCategories[0].name
  );
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState('');
<<<<<<< HEAD
  const [sharedPhone, setSharedPhone] = useState('');
  const [sharedCandidate, setSharedCandidate] = useState<SharedUser | null>(null);
  const [usuariosCompartidos, setUsuariosCompartidos] = useState<SharedUser[]>([]);
  const [myShare, setMyShare] = useState('');
  const [hasTouchedMyShare, setHasTouchedMyShare] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [dateError, setDateError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
=======
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
>>>>>>> origin/main

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

<<<<<<< HEAD
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
    if (!sharedCandidate) return;

    if (sharedCandidate.uid === user?.uid) {
      Alert.alert('No puedes agregarte', 'No puedes agregar tu propio usuario al gasto.');
      return;
    }

    if (usuariosCompartidos.some((item) => item.uid === sharedCandidate.uid)) {
      Alert.alert('Usuario repetido', 'Ya agregaste este usuario al gasto.');
      return;
    }

    setUsuariosCompartidos((prev) => [...prev, sharedCandidate]);
    setSharedCandidate(null);
    setSharedPhone('');
  };

  const handleRemoveSharedUser = (uid: string) => {
    setUsuariosCompartidos((prev) => prev.filter((item) => item.uid !== uid));
  };

=======
>>>>>>> origin/main
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

<<<<<<< HEAD
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

  const friendCount = usuariosCompartidos.length;
  const parsedAmount = Number(amount.replace(',', '.'));
  const parsedMyShare = Number(myShare.replace(',', '.'));
  const friendShareValue =
    friendCount > 0 && Number.isFinite(parsedAmount) && Number.isFinite(parsedMyShare)
      ? (parsedAmount - parsedMyShare) / friendCount
      : 0;

  useEffect(() => {
    if (type !== 'shared') return;

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || friendCount === 0) {
      setMyShare('0.00');
      return;
    }

    if (!hasTouchedMyShare) {
      setMyShare((parsedAmount / (friendCount + 1)).toFixed(2));
    }
  }, [amount, hasTouchedMyShare, parsedAmount, type, friendCount]);

  const handleSave = async () => {
=======
  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));

>>>>>>> origin/main
    if (!title.trim() || !amount.trim() || !category || !date.trim()) {
      Alert.alert('Datos incompletos', 'Completa titulo, monto, tipo, categoria y fecha.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto invalido', 'Ingresa un monto mayor a cero.');
      return;
    }

<<<<<<< HEAD
    if (!parseTransactionDate(date.trim())) {
      Alert.alert('Fecha invalida', 'Ingresa una fecha valida en formato DD/MM/AAAA.');
      return;
    }

=======
>>>>>>> origin/main
    if (!user) {
      Alert.alert('Sesion requerida', 'Inicia sesion para guardar el movimiento.');
      router.replace('/login');
      return;
    }

<<<<<<< HEAD
    const detalleCompartido =
      type === 'shared' && friendCount > 0
        ? {
            total: parsedAmount,
            pagadoPorMi: parsedMyShare,
            pagadoPorAmigo: friendShareValue,
            amigos: usuariosCompartidos.map((amigo) => ({
              uid: amigo.uid,
              nombre: amigo.name,
              telefono: amigo.phone,
              email: amigo.email,
              amount: friendShareValue,
            })),
          }
        : undefined;

    if (type === 'shared') {
      if (friendCount === 0) {
        Alert.alert('Usuarios compartidos requeridos', 'Agrega al menos un amigo al gasto compartido.');
        return;
      }

      if (!Number.isFinite(parsedMyShare) || parsedMyShare <= 0) {
        Alert.alert('Mi parte invalida', 'Ingresa un monto valido para tu parte.');
        return;
      }

      if (!Number.isFinite(friendShareValue) || friendShareValue <= 0) {
        Alert.alert('Distribucion invalida', 'La parte de cada amigo debe ser un valor valido mayor a cero.');
        return;
      }

      if (Math.abs(parsedAmount - (parsedMyShare + friendShareValue * friendCount)) > 0.0001) {
        Alert.alert('Distribucion invalida', 'La suma de mi parte y las partes de los amigos debe coincidir con el monto total.');
        return;
      }
    }

    const sharedPayloadBase = {
      creatorUid: user.uid,
      creatorNombre: user.displayName || 'Yo',
      parteCreador: parsedMyShare,
      parteAmigo: friendShareValue,
      detalleCompartido,
      myShare: parsedMyShare,
    };

=======
>>>>>>> origin/main
    const payload: Omit<Transaction, 'id'> = {
      title: title.trim(),
      amount: parsedAmount,
      type,
      category,
      date: date.trim(),
      note: note.trim(),
      photoUri,
      userId: user.uid,
<<<<<<< HEAD
      status: 'agregado',
      ...(type === 'shared' ? sharedPayloadBase : {}),
=======
>>>>>>> origin/main
    };

    try {
      setIsSaving(true);
      if (id) {
        await updateTransaction(id, payload);
        router.replace({ pathname: '/transaction-detail', params: { id } });
<<<<<<< HEAD
      } else if (type === 'shared') {
        const creatorTransaction = {
          ...payload,
          amount: -parsedMyShare,
          userId: user.uid,
          sharedWith: {
            uid: usuariosCompartidos[0].uid,
            phone: usuariosCompartidos[0].phone,
            name: usuariosCompartidos[0].name,
            amount: friendShareValue,
          },
        };

        await addTransaction(creatorTransaction);

        await Promise.all(
          usuariosCompartidos.map(async (amigo) => {
            await addTransaction({
              ...payload,
              amount: -friendShareValue,
              userId: amigo.uid,
              amigoUid: amigo.uid,
              amigoNombre: amigo.name,
              sharedWith: {
                uid: user.uid,
                phone: user.email || '',
                name: user.displayName || 'Yo',
                amount: parsedMyShare,
              },
              myShare: friendShareValue,
            });

            try {
              const friendBalance = Number(amigo.saldo ?? 0);
              const friendExpenses = Number(amigo.gastos ?? 0);
              await updateDoc(doc(db, 'users', amigo.docId), {
                saldo: friendBalance - friendShareValue,
                gastos: friendExpenses + friendShareValue,
              });
            } catch (updateError) {
              console.warn('No se pudo actualizar saldo del amigo:', updateError);
            }
          })
        );

        router.replace('/transacciones');
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
=======
      <View className="flex-1 bg-gray-50 items-center justify-center">
>>>>>>> origin/main
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
<<<<<<< HEAD
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
=======
    <View className="flex-1 bg-gray-50">
>>>>>>> origin/main
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
<<<<<<< HEAD
              <DollarSign size={32} color={type === 'expense' || type === 'shared' ? '#fb7185' : '#34d399'} />
              <TextInput
                className={`text-4xl font-bold tracking-tight min-w-[140px] ${
                  type === 'expense' || type === 'shared' ? 'text-rose-400' : 'text-emerald-400'
=======
              <DollarSign size={32} color={type === 'expense' ? '#fb7185' : '#34d399'} />
              <TextInput
                className={`text-4xl font-bold tracking-tight min-w-[140px] ${
                  type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
>>>>>>> origin/main
                }`}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                value={amount}
<<<<<<< HEAD
                onChangeText={(value) => setAmount(value.replace(/[^\d.,]/g, ''))}
=======
                onChangeText={setAmount}
>>>>>>> origin/main
              />
            </View>
          </View>
        </View>

        <View className="px-6 mt-8">
<<<<<<< HEAD
          <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Datos</Text>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base mb-2">Tipo</Text>
            <View className="flex-row gap-2">
              {(['expense', 'income', 'shared'] as TransactionType[]).map((item) => {
                const isActive = type === item;
                const label = item === 'expense' ? 'Gasto' : item === 'income' ? 'Ingreso' : 'Compartido';
=======
          <Text className="text-slate-800 text-lg font-bold mb-4">Datos</Text>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <Text className="text-slate-800 font-semibold text-base mb-2">Tipo</Text>
            <View className="flex-row gap-2">
              {(['expense', 'income'] as TransactionType[]).map((item) => {
                const isActive = type === item;
                const label = item === 'expense' ? 'Gasto' : 'Ingreso';
>>>>>>> origin/main

                return (
                  <TouchableOpacity
                    key={item}
                    className={`flex-1 rounded-xl p-4 items-center ${
<<<<<<< HEAD
                      isActive ? 'bg-slate-950' : 'bg-slate-100 dark:bg-gray-700'
                    }`}
                    onPress={() => handleTypeChange(item)}
                  >
                    <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`}>
=======
                      isActive ? 'bg-slate-950' : 'bg-slate-100'
                    }`}
                    onPress={() => handleTypeChange(item)}
                  >
                    <Text className={`font-semibold ${isActive ? 'text-white' : 'text-slate-600'}`}>
>>>>>>> origin/main
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

<<<<<<< HEAD
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <Tag size={20} color="#0f172a" />
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Titulo</Text>
            </View>
            <TextInput
              className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100 text-base"
=======
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <Tag size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Titulo</Text>
            </View>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-base"
>>>>>>> origin/main
              placeholder="Ej: Supermercado"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

<<<<<<< HEAD
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
                      <Text className="text-white font-semibold">Agregar al gasto</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {usuariosCompartidos.length > 0 ? (
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-gray-400 text-xs mb-2">
                    Usuarios agregados ({usuariosCompartidos.length})
                  </Text>
                  {usuariosCompartidos.map((amigo) => (
                    <View
                      key={amigo.uid}
                      className="flex-row items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border border-slate-100 dark:border-gray-600"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-slate-800 dark:text-gray-100 font-semibold">{amigo.name}</Text>
                        <Text className="text-slate-500 dark:text-gray-400 text-sm">{amigo.phone}</Text>
                        <Text className="text-slate-500 dark:text-gray-400 text-sm mt-1">
                          Parte: $ {Number.isFinite(friendShareValue) ? friendShareValue.toFixed(2) : '0.00'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="bg-rose-500 rounded-full w-10 h-10 items-center justify-center"
                        onPress={() => handleRemoveSharedUser(amigo.uid)}
                      >
                        <Text className="text-white font-bold">X</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}

              <View className="bg-slate-50 dark:bg-gray-700 rounded-2xl p-4 border border-slate-100 dark:border-gray-600">
                <Text className="text-slate-500 dark:text-gray-400 text-xs mb-1">Monto total</Text>
                <Text className="text-slate-800 dark:text-gray-100 text-xl font-bold mb-3">
                  $ {Number.isFinite(parsedAmount) ? parsedAmount.toFixed(2) : '0.00'}
                </Text>

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
                  <Text className="text-slate-500 dark:text-gray-400 text-xs mb-1">Parte por amigo</Text>
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
=======
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <Calendar size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Fecha</Text>
            </View>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-base"
              keyboardType="number-pad"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94a3b8"
              value={date}
              onChangeText={(value) => setDate(formatDateInput(value))}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <Text className="text-slate-800 font-semibold text-base mb-3">Categoria</Text>
>>>>>>> origin/main
            {transactionCategories
              .filter((item) => (type === 'income' ? item.name === 'Ingresos' : item.name !== 'Ingresos'))
              .map((item) => {
                const Icon = item.icon;
                const isSelected = item.name === category;

                return (
                  <TouchableOpacity
                    key={item.name}
                    className={`rounded-2xl p-4 flex-row items-center justify-between mb-3 ${
<<<<<<< HEAD
                      isSelected ? 'bg-slate-950' : 'bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600'
=======
                      isSelected ? 'bg-slate-950' : 'bg-slate-50 border border-slate-100'
>>>>>>> origin/main
                    }`}
                    onPress={() => setCategory(item.name)}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`${item.bgColor} w-12 h-12 rounded-full items-center justify-center`}>
                        <Icon size={24} color={item.iconColor} />
                      </View>
<<<<<<< HEAD
                      <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-slate-800 dark:text-gray-100'}`}>
=======
                      <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-slate-800'}`}>
>>>>>>> origin/main
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color="white" />}
                  </TouchableOpacity>
                );
              })}
          </View>

<<<<<<< HEAD
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <FileText size={20} color="#0f172a" />
              <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Nota</Text>
            </View>
            <TextInput
              className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl px-4 py-3 text-slate-800 dark:text-gray-100 text-base min-h-[96px]"
=======
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <FileText size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Nota</Text>
            </View>
            <TextInput
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-base min-h-[96px]"
>>>>>>> origin/main
              multiline
              placeholder="Detalle opcional"
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>

<<<<<<< HEAD
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Camera size={20} color="#0f172a" />
                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base ml-2">Foto</Text>
=======
          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Camera size={20} color="#0f172a" />
                <Text className="text-slate-800 font-semibold text-base ml-2">Foto</Text>
>>>>>>> origin/main
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
<<<<<<< HEAD
              <View className="bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-2xl h-32 items-center justify-center">
                <Camera size={28} color="#94a3b8" />
                <Text className="text-slate-400 dark:text-gray-500 mt-2">Sin imagen adjunta</Text>
=======
              <View className="bg-slate-50 border border-slate-100 rounded-2xl h-32 items-center justify-center">
                <Camera size={28} color="#94a3b8" />
                <Text className="text-slate-400 mt-2">Sin imagen adjunta</Text>
>>>>>>> origin/main
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
