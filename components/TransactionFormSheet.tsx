import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  Camera,
  Check,
  DollarSign,
  FileText,
  Images,
  Tag,
  Trash2,
  X,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatMoneyInput, validateMoneyInput } from '../utils/money';
import { deleteReceipt, uploadReceipt } from '../services/receipt.service';
import {
  pickReceiptFromLibrary,
  takeReceiptPhoto,
} from '../services/receipt-picker.service';

type TransactionType = 'income' | 'expense' | 'shared';

interface TransactionFormSheetProps {
  visible: boolean;
  onClose: () => void;
  transactionId?: number | null;
  onSaveSuccess: () => void;
}

export default function TransactionFormSheet({
  visible,
  onClose,
  transactionId,
  onSaveSuccess,
}: TransactionFormSheetProps) {
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(transactionId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(transactionCategories[0].name);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dateError, setDateError] = useState('');
  const [amountError, setAmountError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Cargar transacción si estamos editando
  const loadTransaction = useCallback(async () => {
    if (!transactionId) {
      // Resetear formulario para nueva transacción
      setTitle('');
      setAmount('');
      setAmountError('');
      setType('expense');
      setCategory(transactionCategories[0].name);
      // Poner fecha de hoy por defecto
      const today = new Date();
      const dayStr = String(today.getDate()).padStart(2, '0');
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const yearStr = today.getFullYear();
      setDate(`${dayStr}/${monthStr}/${yearStr}`);
      setNote('');
      setSelectedImageUri('');
      setSelectedImageMimeType(null);
      setOriginalImagePath(null);
      setImageChanged(false);
      setDateError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const transaction = await getTransactionById(transactionId);
      if (transaction) {
        setTitle(transaction.title);
        setAmount(formatMoneyInput(transaction.amount));
        setAmountError('');
        setType(transaction.type);
        setCategory(transaction.category || 'Alimentacion');
        setDate(transaction.date || '');
        setNote(transaction.note || '');
        setSelectedImageUri(transaction.imageUrl || '');
        setSelectedImageMimeType(null);
        setOriginalImagePath(transaction.imagePath || null);
        setImageChanged(false);
        setDateError('');
      } else {
        Alert.alert('No encontrado', 'El movimiento ya no existe.');
        onClose();
      }
    } catch (error) {
      console.error('Error cargando transacción:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles.');
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, onClose]);

  useEffect(() => {
    if (visible) {
      loadTransaction();
    }
  }, [visible, loadTransaction]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === 'income' ? 'Ingresos' : 'Alimentacion');
  };

  const setPickedPhoto = (picked: { uri: string; mimeType?: string | null }) => {
    setSelectedImageUri(picked.uri);
    setSelectedImageMimeType(picked.mimeType || null);
    setImageChanged(true);
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await pickReceiptFromLibrary();
      if (picked) setPickedPhoto(picked);
    } catch (error) {
      Alert.alert('Permiso requerido', error instanceof Error ? error.message : 'No se pudo abrir la galeria.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const picked = await takeReceiptPhoto();
      if (picked) setPickedPhoto(picked);
    } catch (error) {
      Alert.alert('Permiso requerido', error instanceof Error ? error.message : 'No se pudo abrir la camara.');
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImageUri('');
    setSelectedImageMimeType(null);
    setImageChanged(true);
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
        setDateError('Fecha inválida');
        triggerShake();
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(formatMoneyInput(value));
    if (amountError) setAmountError('');
  };

  const handleSave = async () => {
    if (!title.trim() || !amount.trim() || !category || !date.trim()) {
      Alert.alert('Datos incompletos', 'Completa título, monto, tipo, categoría y fecha.');
      return;
    }

    const amountValidation = validateMoneyInput(amount);
    if (!amountValidation.valid) {
      setAmountError(amountValidation.error);
      return;
    }

    if (!parseTransactionDate(date.trim())) {
      Alert.alert('Fecha inválida', 'Ingresa una fecha válida en formato DD/MM/AAAA.');
      return;
    }

    if (!user) {
      Alert.alert('Sesión requerida', 'Inicia sesión para guardar el movimiento.');
      return;
    }

    let uploadedImagePath: string | null = null;
    try {
      setIsSaving(true);
      if (imageChanged && selectedImageUri) {
        uploadedImagePath = await uploadReceipt({
          uri: selectedImageUri,
          mimeType: selectedImageMimeType,
        });
      }

      const nextImagePath = imageChanged ? uploadedImagePath : originalImagePath;
      const payload: Omit<Transaction, 'id' | 'status'> = {
        title: title.trim(),
        amount: amountValidation.value,
        type,
        category,
        date: date.trim(),
        note: note.trim(),
        imagePath: nextImagePath,
        userId: user.uid,
      };

      if (transactionId) {
        await updateTransaction(transactionId, payload);
      } else {
        await addTransaction(payload);
      }

      if (imageChanged && originalImagePath && originalImagePath !== uploadedImagePath) {
        try {
          await deleteReceipt(originalImagePath);
        } catch (error) {
          console.warn('No se pudo eliminar el comprobante anterior:', error);
        }
      }

      onSaveSuccess();
      onClose();
    } catch (error) {
      if (uploadedImagePath) {
        try {
          await deleteReceipt(uploadedImagePath);
        } catch {
          // The orphan can be cleaned up later if rollback fails.
        }
      }
      Alert.alert('Error', `No se pudo guardar el movimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-slate-950/10 backdrop-blur-[3px] justify-end md:justify-center md:items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pb-8 pt-2 max-h-[85%] border-t border-slate-200 dark:border-slate-800 md:max-w-xl md:w-full md:rounded-3xl md:shadow-2xl md:border flex flex-col"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Barra superior de arrastre */}
          <View className="w-12 h-1.5 bg-slate-350 dark:bg-slate-700 rounded-full mx-auto mb-4 mt-1" />

          {isLoading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#0f172a" />
            </View>
          ) : (
            <View className="w-full flex-1 flex flex-col">
              {/* Encabezado */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-slate-800 dark:text-slate-100 text-xl font-bold">
                  {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                </Text>
                <TouchableOpacity
                  className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
                  onPress={onClose}
                >
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
                {/* Tarjeta de Monto */}
                <View className={`bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 items-center border mb-5 ${
                  amountError ? 'border-rose-400 dark:border-rose-500' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Monto</Text>
                  <View className="flex-row items-center justify-center">
                    <DollarSign size={28} color={type === 'expense' ? '#f43f5e' : '#10b981'} />
                    <TextInput
                      className={`text-3xl font-extrabold tracking-tight min-w-[120px] text-center ${
                        type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      value={amount}
                      onChangeText={handleAmountChange}
                      onBlur={() => {
                        const validation = validateMoneyInput(amount);
                        setAmountError(validation.valid ? '' : validation.error);
                      }}
                    />
                  </View>
                  {amountError ? (
                    <Text className="text-rose-500 text-xs mt-2 font-semibold">
                      {amountError}
                    </Text>
                  ) : null}
                </View>

                {/* Tipo de Movimiento (Gasto / Ingreso) */}
                <View className="bg-slate-50 dark:bg-slate-850 p-1.5 rounded-2xl flex-row gap-2 border border-slate-100 dark:border-slate-800 mb-4">
                  {(['expense', 'income'] as TransactionType[]).map((item) => {
                    const isActive = type === item;
                    const label = item === 'expense' ? 'Gasto' : 'Ingreso';

                    return (
                      <TouchableOpacity
                        key={item}
                        className={`flex-1 rounded-xl py-3.5 items-center ${
                          isActive ? 'bg-[#0f172a] dark:bg-indigo-600 shadow-sm' : 'active:bg-slate-100 dark:active:bg-slate-800'
                        }`}
                        onPress={() => handleTypeChange(item)}
                      >
                        <Text className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Input: Título */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <Tag size={18} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-350 font-semibold text-sm ml-2">Título</Text>
                  </View>
                  <TextInput
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm"
                    placeholder="Ej: Supermercado"
                    placeholderTextColor="#94a3b8"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Input: Fecha */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <CalendarIcon size={18} color={dateError ? '#f43f5e' : '#64748b'} />
                    <Text className={`font-semibold text-sm ml-2 ${dateError ? 'text-rose-500' : 'text-slate-600 dark:text-slate-350'}`}>
                      Fecha
                    </Text>
                  </View>
                  <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                    <TextInput
                      className={`bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm ${
                        dateError ? 'border-rose-400 dark:border-rose-500' : 'border-slate-100 dark:border-slate-700'
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
                    <Text className="text-rose-500 text-xs mt-1.5 ml-1 font-semibold">
                      {dateError}
                    </Text>
                  ) : null}
                </View>

                {/* Categorías */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-sm">
                  <Text className="text-slate-650 dark:text-slate-300 font-bold text-sm mb-3">Categoría</Text>
                  {transactionCategories
                    .filter((item) => (type === 'income' ? item.name === 'Ingresos' : item.name !== 'Ingresos'))
                    .map((item) => {
                      const Icon = item.icon;
                      const isSelected = item.name === category;

                      return (
                        <TouchableOpacity
                          key={item.name}
                          className={`rounded-2xl p-3 flex-row items-center justify-between mb-2 ${
                            isSelected
                              ? 'bg-[#0f172a] dark:bg-indigo-600'
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                          }`}
                          onPress={() => setCategory(item.name)}
                        >
                          <View className="flex-row items-center gap-3.5">
                            <View className={`${item.bgColor} w-10 h-10 rounded-full items-center justify-center shadow-sm`}>
                              <Icon size={20} color={item.iconColor} />
                            </View>
                            <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {item.name}
                            </Text>
                          </View>
                          {isSelected && <Check size={18} color="white" />}
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {/* Input: Nota */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <FileText size={18} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-350 font-semibold text-sm ml-2">Nota</Text>
                  </View>
                  <TextInput
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm min-h-[80px]"
                    multiline
                    placeholder="Detalle opcional..."
                    placeholderTextColor="#94a3b8"
                    textAlignVertical="top"
                    value={note}
                    onChangeText={setNote}
                  />
                </View>

                {/* Input: Foto */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <Camera size={18} color="#64748b" />
                      <Text className="text-slate-600 dark:text-slate-350 font-semibold text-sm ml-2">Foto Adjunta</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5"
                        onPress={handleTakePhoto}
                        accessibilityLabel="Tomar foto"
                      >
                        <Camera size={17} color="#475569" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-[#0f172a] dark:bg-indigo-600 rounded-xl p-2.5"
                        onPress={handlePickPhoto}
                        accessibilityLabel="Elegir de la galeria"
                      >
                        <Images size={17} color="white" />
                      </TouchableOpacity>
                      {selectedImageUri ? (
                        <TouchableOpacity
                          className="bg-rose-100 dark:bg-rose-950/40 rounded-xl p-2.5"
                          onPress={handleRemovePhoto}
                          accessibilityLabel="Quitar foto"
                        >
                          <Trash2 size={17} color="#f43f5e" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  {selectedImageUri ? (
                    <Image source={{ uri: selectedImageUri }} className="w-full h-40 rounded-2xl border border-slate-100 dark:border-slate-800" />
                  ) : (
                    <View className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl h-28 items-center justify-center">
                      <Camera size={24} color="#94a3b8" />
                      <Text className="text-slate-400 dark:text-slate-500 mt-1.5 text-xs">Sin imagen adjunta</Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Botón de Guardado */}
              <TouchableOpacity
                className={`rounded-xl p-4 flex-row items-center justify-center gap-2 ${
                  isSaving ? 'bg-slate-400' : 'bg-[#0f172a] dark:bg-indigo-600 active:opacity-95 shadow-md'
                }`}
                disabled={isSaving}
                onPress={handleSave}
              >
                {isSaving ? <ActivityIndicator color="white" /> : <Check size={18} color="white" />}
                <Text className="text-white font-bold text-base">
                  {isSaving ? 'Guardando...' : 'Guardar Movimiento'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
