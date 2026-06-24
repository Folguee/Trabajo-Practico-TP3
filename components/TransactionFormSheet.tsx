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
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import {
  addTransaction,
  getTransactionById,
  TransactionInput,
  updateTransaction,
} from '../services/transaction.service';
import { getCategoryConfig } from '../constants/transactions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatMoneyInput, validateMoneyInput } from '../utils/money';
import { formatDateInput, formatDisplayDate, parseDateInput } from '../utils/date';
import { deleteReceipt, uploadReceipt } from '../services/receipt.service';
import { analyzeReceipt } from '../services/receipt-ocr.service';
import {
  pickReceiptDocument,
  pickReceiptFromLibrary,
  takeReceiptPhoto,
} from '../services/receipt-picker.service';
import { getCategories } from '../services/category.service';
import { getPublicUsers } from '../services/user-directory.service';
import { auth } from '../services/firebase';
import { validateAndCalculateSharedParticipants } from '../utils/shared-expense';
import type {
  Category,
  PublicUser,
  SharedParticipant,
  SharedSplitMode,
  TransactionType,
} from '../types';

interface TransactionFormSheetProps {
  visible: boolean;
  onClose: () => void;
  transactionId?: string | null;
  onSaveSuccess: () => void;
  initialType?: 'income' | 'expense';
}

export default function TransactionFormSheet({
  visible,
  onClose,
  transactionId,
  onSaveSuccess,
  initialType = 'expense',
}: TransactionFormSheetProps) {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(transactionId);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string | null>(null);
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');
  const [amountError, setAmountError] = useState('');
 
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [ocrCompletedFields, setOcrCompletedFields] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [sharedError, setSharedError] = useState('');
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<PublicUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [payerUid, setPayerUid] = useState('');
  const [splitMode, setSplitMode] = useState<SharedSplitMode>('equal');
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const loadPublicUsers = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoadingUsers(true);
    setUsersError('');
    try {
      const users = await getPublicUsers();
      if (!isMountedRef.current) return;
      setPublicUsers(users);
    } catch (error) {
      console.error('Error cargando directorio publico:', error);
      if (!isMountedRef.current) return;
      setPublicUsers([]);
      setUsersError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la lista de usuarios'
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoadingUsers(false);
      }
    }
  }, []);

  // Cargar transacción si estamos editando
  const loadTransaction = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    try {
      const loadedCategories = await getCategories();
      if (!isMountedRef.current) return;
      setCategories(loadedCategories);
      await loadPublicUsers();
      const currentUser = auth.currentUser;
      const me: PublicUser | null = currentUser
        ? {
            uid: currentUser.uid,
            nombre:
              currentUser.displayName ||
              currentUser.email?.split('@')[0] ||
              'Yo',
            nombreLower: (
              currentUser.displayName ||
              currentUser.email?.split('@')[0] ||
              'Yo'
            ).toLocaleLowerCase('es'),
          }
        : null;

      if (!transactionId) {
        const defaultCategory =
          loadedCategories.find((item) => item.type === initialType) ||
          loadedCategories[0];
        setTitle('');
        setTitleError('');
        setAmount('');
        setAmountError('');
        setType(initialType);
        setCategoryId(defaultCategory?.id || '');
        setDate(formatDisplayDate(new Date()));
        setNote('');
        setSelectedImageUri('');
        setSelectedImageMimeType(null);
        setOriginalImagePath(null);
        setImageChanged(false);
        setDateError('');
        setCategoryError('');
        setSharedError('');
        setSelectedUsers(me ? [me] : []);
        setPayerUid(me?.uid || '');
        setSplitMode('equal');
        setSplitValues({});
        setUserSearch('');
        setOcrError(null);
        setOcrWarnings([]);
        setOcrCompletedFields([]);
        setCategoryError('');
        setSharedError('');
        setSelectedUsers(me ? [me] : []);
        setPayerUid(me?.uid || '');
        setSplitMode('equal');
        setSplitValues({});
        setUserSearch('');
        return;
      }

      const transaction = await getTransactionById(transactionId);
      if (transaction) {
        if (
          transaction.type === 'shared' &&
          transaction.creatorUid !== currentUser?.uid
        ) {
          Alert.alert(
            'Solo lectura',
            'Solo el creador puede editar este gasto compartido.'
          );
          onClose();
          return;
        }
        setTitle(transaction.title);
        setTitleError('');
        setAmount(
          formatMoneyInput(
            transaction.type === 'shared'
              ? transaction.totalAmount || transaction.amount
              : transaction.amount
          )
        );
        setAmountError('');
        setType(transaction.type);
        setCategoryId(transaction.categoryId);
        setDate(formatDisplayDate(transaction.date));
        setNote(transaction.note || '');
        setSelectedImageUri(transaction.imageUrl || '');
        setSelectedImageMimeType(null);
        setOriginalImagePath(transaction.imagePath || null);
        setImageChanged(false);
        setDateError('');
        setCategoryError('');
        setSharedError('');
        if (transaction.type === 'shared' && transaction.participants) {
          setSelectedUsers(
            transaction.participants.map((participant) => ({
              uid: participant.uid,
              nombre: participant.nombre,
              nombreLower: participant.nombre.toLocaleLowerCase('es'),
            }))
          );
          setPayerUid(transaction.payerUid || transaction.creatorUid || '');
          setSplitMode(transaction.splitMode || 'equal');
          setSplitValues(
            Object.fromEntries(
              transaction.participants.map((participant) => [
                participant.uid,
                String(
                  transaction.splitMode === 'percentage'
                    ? participant.percentage
                    : participant.amount
                ),
              ])
            )
          );
        } else {
          setSelectedUsers(me ? [me] : []);
          setPayerUid(me?.uid || '');
          setSplitMode('equal');
          setSplitValues({});
        }
        setOcrError(null);
        setOcrWarnings([]);
        setOcrCompletedFields([]);
        setCategoryError('');
        setSharedError('');
        if (transaction.type === 'shared' && transaction.participants) {
          setSelectedUsers(
            transaction.participants.map((participant) => ({
              uid: participant.uid,
              nombre: participant.nombre,
              nombreLower: participant.nombre.toLocaleLowerCase('es'),
            }))
          );
          setPayerUid(transaction.payerUid || transaction.creatorUid || '');
          setSplitMode(transaction.splitMode || 'equal');
          setSplitValues(
            Object.fromEntries(
              transaction.participants.map((participant) => [
                participant.uid,
                String(
                  transaction.splitMode === 'percentage'
                    ? participant.percentage
                    : participant.amount
                ),
              ])
            )
          );
        } else {
          setSelectedUsers(me ? [me] : []);
          setPayerUid(me?.uid || '');
          setSplitMode('equal');
          setSplitValues({});
        }
      } else {
        Alert.alert('No encontrado', 'El movimiento ya no existe.');
        onClose();
      }
    } catch (error) {
      console.error('Error cargando transacción:', error);
      Alert.alert('Error', 'No se pudo cargar el formulario.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [initialType, transactionId, onClose, loadPublicUsers]);

  useEffect(() => {
    if (visible) {
      loadTransaction();
    }
  }, [visible, loadTransaction]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategoryError('');
    setSharedError('');
    const categoryType = nextType === 'income' ? 'income' : 'expense';
    setCategoryId(
      categories.find((category) => category.type === categoryType)?.id || ''
    );
  };

  const setPickedPhoto = (picked: { uri: string; mimeType?: string | null }) => {
    setSelectedImageUri(picked.uri);
    setSelectedImageMimeType(picked.mimeType || null);
    setImageChanged(true);
    setOcrError(null);
    setOcrWarnings([]);
    setOcrCompletedFields([]);
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
    setOcrError(null);
    setOcrWarnings([]);
    setOcrCompletedFields([]);
  };

  const handlePickDocument = async () => {
    try {
      const picked = await pickReceiptDocument();
      if (picked) setPickedPhoto(picked);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir el selector de documentos.');
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: any) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.nativeEvent?.dataTransfer?.files || e.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert('Archivo demasiado grande', 'El archivo debe pesar menos de 5 MB.');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Alert.alert('Formato no soportado', 'Solo se aceptan imágenes JPEG, PNG, WebP y archivos PDF.');
        return;
      }

      const uri = URL.createObjectURL(file);
      setPickedPhoto({
        uri,
        mimeType: file.type,
      });

      Alert.alert(
        'Archivo adjunto',
        `Se adjuntó "${file.name}" correctamente.`
      );
    }
  };

  const handleAnalyzeReceipt = async () => {
    if (!selectedImageUri) return;
    setIsOcrLoading(true);
    setOcrError(null);
    setOcrWarnings([]);
    setOcrCompletedFields([]);
    try {
      const result = await analyzeReceipt({
        uri: selectedImageUri,
        mimeType: selectedImageMimeType,
      });

      const completed: string[] = [];

      if (!title.trim() && result.title.value) {
        let cleanedTitle = result.title.value;
        // Clean trailing noise words like "FACTURA", "TICKET"
        cleanedTitle = cleanedTitle.replace(/\s+(?:factura|ticket|comprobante|original|duplicado)\b.*$/i, '').trim();
        setTitle(cleanedTitle);
        completed.push('Título');
      }

      if (!amount.trim() && result.amount.value !== null) {
        setAmount(formatMoneyInput(result.amount.value));
        completed.push('Monto');
      }

      if (result.date.value) {
        setDate(result.date.value);
        completed.push('Fecha');
      }

      setOcrCompletedFields(completed);
      if (result.warnings && result.warnings.length > 0) {
        const filteredWarnings = result.warnings.filter(w =>
          !w.toLowerCase().includes('categoría')
        );
        setOcrWarnings(filteredWarnings);
      }

      if (completed.length === 0) {
        Alert.alert(
          'Análisis finalizado',
          'No se autocompletaron nuevos campos vacíos. Es posible que los campos ya contengan datos o que la confianza del análisis fuera baja.'
        );
      } else {
        Alert.alert(
          'Campos sugeridos',
          `Se autocompletaron los campos vacíos: ${completed.join(', ')}.`
        );
      }
    } catch (err: any) {
      console.error('Error al analizar comprobante:', err);
      setOcrError(err.message || 'Error al analizar el comprobante.');
    } finally {
      setIsOcrLoading(false);
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
      if (!parseDateInput(formatted)) {
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

  const addSharedUser = (user: PublicUser) => {
    setSelectedUsers((current) =>
      current.some((item) => item.uid === user.uid)
        ? current
        : [...current, user]
    );
    setUserSearch('');
    setSharedError('');
  };

  const removeSharedUser = (uid: string) => {
    if (uid === auth.currentUser?.uid) return;
    setSelectedUsers((current) => current.filter((item) => item.uid !== uid));
    setSplitValues((current) => {
      const next = { ...current };
      delete next[uid];
      return next;
    });
    if (payerUid === uid) setPayerUid(auth.currentUser?.uid || '');
    setSharedError('');
  };

  const handleSave = async () => {
    const nextTitleError = title.trim() ? '' : 'Ingresa un título.';
    const nextAmountError = amount.trim() ? '' : 'Ingresa un monto.';
    const nextCategoryError = categoryId ? '' : 'Selecciona una categoría.';
    const nextDateError = date.trim() ? '' : 'Ingresa una fecha.';

    setTitleError(nextTitleError);
    setAmountError(nextAmountError);
    setCategoryError(nextCategoryError);
    setDateError(nextDateError);
    setSharedError('');

    const missingFields = [
      nextTitleError ? 'título' : '',
      nextAmountError ? 'monto' : '',
      nextCategoryError ? 'categoría' : '',
      nextDateError ? 'fecha' : '',
    ].filter(Boolean);

    if (missingFields.length > 0) {
      Alert.alert(
        'Datos incompletos',
        `Completa los siguientes campos: ${missingFields.join(', ')}.`
      );
      return;
    }

    const amountValidation = validateMoneyInput(amount);
    if (!amountValidation.valid) {
      const errorMessage =
        'error' in amountValidation
          ? amountValidation.error
          : 'Monto inválido';
      setAmountError(errorMessage);
      Alert.alert('Monto inválido', errorMessage);
      return;
    }

    const parsedDate = parseDateInput(date.trim());
    if (!parsedDate) {
      setDateError('Fecha inválida');
      triggerShake();
      Alert.alert('Fecha inválida', 'Ingresa una fecha válida en formato DD/MM/AAAA.');
      return;
    }

    const selectedCategory = categories.find(
      (category) => category.id === categoryId
    );
    if (!selectedCategory) {
      setCategoryError('Selecciona nuevamente una categoría disponible.');
      Alert.alert(
        'Categoría inválida',
        'Selecciona nuevamente una categoría disponible.'
      );
      return;
    }

    let sharedParticipants: SharedParticipant[] | undefined;
    if (type === 'shared') {
      if (!auth.currentUser) {
        setSharedError('Vuelve a iniciar sesión para guardar el gasto.');
        Alert.alert('Sesión inválida', 'Vuelve a iniciar sesión para guardar el gasto.');
        return;
      }
      if (
        !selectedUsers.some((participant) => participant.uid === auth.currentUser?.uid)
      ) {
        setSharedError('El creador debe estar incluido entre los participantes.');
        Alert.alert(
          'Revisa el gasto compartido',
          'El creador debe estar incluido entre los participantes.'
        );
        return;
      }

      try {
        sharedParticipants = validateAndCalculateSharedParticipants(
          amountValidation.value,
          selectedUsers,
          payerUid,
          splitMode,
          splitValues
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Completa los datos del reparto.';
        setSharedError(errorMessage);
        Alert.alert(
          'Revisa el gasto compartido',
          errorMessage
        );
        return;
      }
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

      const payload: TransactionInput = {
        title: title.trim(),
        amount:
          type === 'shared'
            ? sharedParticipants?.find(
                (participant) => participant.uid === auth.currentUser?.uid
              )?.amount || 0
            : amountValidation.value,
        type,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        date: parsedDate,
        note: note.trim(),
        imagePath: nextImagePath,
        ...(type === 'shared'
          ? {
              creatorUid: auth.currentUser?.uid,
              participantUids: selectedUsers.map((user) => user.uid),
              participants: sharedParticipants,
              payerUid,
              totalAmount: amountValidation.value,
              splitMode,
            }
          : {}),
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
                {/* Comprobante Adjunto (arriba para auto-completar) */}
                <View
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm mb-5 ${
                    isDragging
                      ? 'border-dashed border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                  {...({
                    onDragOver: handleDragOver,
                    onDragLeave: handleDragLeave,
                    onDrop: handleDrop,
                  } as any)}
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <Camera size={18} color="#64748b" />
                      <Text className="text-slate-600 dark:text-slate-350 font-semibold text-sm ml-2">Comprobante Adjunto</Text>
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
                      <TouchableOpacity
                        className="bg-[#0f172a] dark:bg-indigo-600 rounded-xl p-2.5"
                        onPress={handlePickDocument}
                        accessibilityLabel="Elegir de documentos"
                      >
                        <FileText size={17} color="white" />
                      </TouchableOpacity>
                      {selectedImageUri ? (
                        <TouchableOpacity
                          className="bg-rose-100 dark:bg-rose-950/40 rounded-xl p-2.5"
                          onPress={handleRemovePhoto}
                          accessibilityLabel="Quitar archivo"
                        >
                          <Trash2 size={17} color="#f43f5e" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  {selectedImageUri ? (
                    <View className="gap-3">
                      {selectedImageMimeType === 'application/pdf' || selectedImageUri.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                        <View className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl h-40 items-center justify-center gap-2">
                          <FileText size={40} color="#6366f1" />
                          <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                            Documento PDF adjunto
                          </Text>
                          <Text className="text-slate-400 dark:text-slate-500 text-xs text-center px-4" numberOfLines={1}>
                            {selectedImageUri.split('/').pop() || 'comprobante.pdf'}
                          </Text>
                        </View>
                      ) : (
                        <Image source={{ uri: selectedImageUri }} className="w-full h-40 rounded-2xl border border-slate-100 dark:border-slate-800" />
                      )}
                      
                      {(type === 'expense' || type === 'shared') && (
                        <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-105 dark:border-slate-750">
                          {isOcrLoading ? (
                            <View className="flex-row items-center justify-center py-2 gap-2">
                              <ActivityIndicator size="small" color="#6366f1" />
                              <Text className="text-slate-650 dark:text-slate-300 font-semibold text-xs">
                                Analizando comprobante...
                              </Text>
                            </View>
                          ) : ocrError ? (
                            <View className="gap-2">
                              <Text className="text-rose-500 text-xs font-semibold">{ocrError}</Text>
                              <TouchableOpacity
                                className="bg-indigo-650 active:bg-indigo-700 rounded-xl py-2.5 items-center"
                                onPress={handleAnalyzeReceipt}
                              >
                                <Text className="text-white text-xs font-bold">Reintentar análisis</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View className="flex-row items-center justify-between">
                              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                                ¿Autocompletar campos usando IA?
                              </Text>
                              <TouchableOpacity
                                className="bg-[#6366f1] active:opacity-90 rounded-xl px-4 py-2 flex-row items-center gap-1.5 shadow-sm"
                                onPress={handleAnalyzeReceipt}
                              >
                                <Sparkles size={13} color="white" />
                                <Text className="text-white text-xs font-bold">Analizar</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* Suggested Fields */}
                          {ocrCompletedFields.length > 0 && (
                            <View className="mt-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 flex-row items-center gap-2.5">
                              <Check size={15} color="#10b981" />
                              <Text className="text-emerald-800 dark:text-emerald-300 text-xs font-medium flex-1">
                                Campos completados: <Text className="font-bold">{ocrCompletedFields.join(', ')}</Text>
                              </Text>
                            </View>
                          )}

                          {/* Warnings list */}
                          {ocrWarnings.length > 0 && (
                            <View className="mt-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3 gap-1">
                              {ocrWarnings.map((warning, idx) => (
                                <Text key={idx} className="text-amber-800 dark:text-amber-400 text-[11px] leading-4">
                                  • {warning}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl h-28 items-center justify-center">
                      <Camera size={24} color="#94a3b8" />
                      <Text className="text-slate-400 dark:text-slate-500 mt-1.5 text-xs">Sin archivo adjunto</Text>
                    </View>
                  )}
                </View>

                {/* Tarjeta de Monto */}
                <View className={`bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 items-center border mb-5 ${
                  amountError ? 'border-rose-400 dark:border-rose-500' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Monto</Text>
                  <View className="flex-row items-center justify-center">
                    <DollarSign size={28} color={type === 'income' ? '#10b981' : '#f43f5e'} />
                    <TextInput
                      className={`text-3xl font-extrabold tracking-tight min-w-[120px] text-center ${
                        type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      value={amount}
                      onChangeText={handleAmountChange}
                      onBlur={() => {
                        const validation = validateMoneyInput(amount);
                        setAmountError(
                          validation.valid
                            ? ''
                            : 'error' in validation
                              ? validation.error
                              : 'Monto invalido'
                        );
                      }}
                    />
                  </View>
                  {amountError ? (
                    <Text className="text-rose-500 text-xs mt-2 font-semibold">
                      {amountError}
                    </Text>
                  ) : null}
                </View>

                {/* Tipo de Movimiento */}
                <View className="bg-slate-50 dark:bg-slate-850 p-1.5 rounded-2xl flex-row gap-2 border border-slate-100 dark:border-slate-800 mb-4">
                  {(['expense', 'income', 'shared'] as TransactionType[]).map((item) => {
                    const isActive = type === item;
                    const label =
                      item === 'expense'
                        ? 'Gasto'
                        : item === 'income'
                          ? 'Ingreso'
                          : 'Compartido';

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

                {type === 'shared' ? (
                  <View className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 mb-3 shadow-sm ${
                    sharedError
                      ? 'border-rose-400 dark:border-rose-500'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}>
                    <View className="flex-row items-center mb-3">
                      <Users size={18} color="#64748b" />
                      <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm ml-2">
                        Participantes
                      </Text>
                    </View>

                    <TextInput
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm mb-2"
                      placeholder="Buscar usuario por nombre"
                      placeholderTextColor="#94a3b8"
                      value={userSearch}
                      onChangeText={setUserSearch}
                    />
                    <View className="mb-3">
                      {isLoadingUsers ? (
                        <View className="py-4 items-center">
                          <ActivityIndicator size="small" color="#6366f1" />
                          <Text className="text-slate-400 text-xs mt-2">
                            Cargando usuarios...
                          </Text>
                        </View>
                      ) : usersError ? (
                        <View className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3">
                          <Text className="text-rose-600 dark:text-rose-300 text-xs mb-2">
                            No se pudo cargar el directorio: {usersError}
                          </Text>
                          <TouchableOpacity onPress={loadPublicUsers}>
                            <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                              Reintentar
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : publicUsers.filter(
                          (user) =>
                            user.nombreLower.includes(
                              userSearch.trim().toLocaleLowerCase('es')
                            ) &&
                            !selectedUsers.some(
                              (selected) => selected.uid === user.uid
                            )
                        ).length === 0 ? (
                        <Text className="text-slate-400 dark:text-slate-500 text-xs py-3">
                          {publicUsers.length === 0
                            ? 'Todavía no hay otros usuarios disponibles. Deben abrir la app una vez para aparecer en el directorio.'
                            : 'No se encontraron usuarios con ese nombre.'}
                        </Text>
                      ) : (
                        publicUsers
                        .filter(
                          (user) =>
                            user.nombreLower.includes(
                              userSearch.trim().toLocaleLowerCase('es')
                            ) &&
                            !selectedUsers.some(
                              (selected) => selected.uid === user.uid
                            )
                        )
                        .slice(0, 6)
                        .map((user) => (
                            <TouchableOpacity
                              key={user.uid}
                              className="flex-row items-center justify-between py-3 px-2 border-b border-slate-100 dark:border-slate-800"
                              onPress={() => addSharedUser(user)}
                            >
                              <Text className="text-slate-700 dark:text-slate-200">
                                {user.nombre}
                              </Text>
                              <UserPlus size={17} color="#6366f1" />
                            </TouchableOpacity>
                          ))
                      )}
                    </View>

                    {selectedUsers.map((user) => {
                      const isMe = user.uid === auth.currentUser?.uid;
                      return (
                        <View
                          key={user.uid}
                          className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-2"
                        >
                          <Text className="text-slate-700 dark:text-slate-200 font-semibold">
                            {user.nombre}{isMe ? ' (yo)' : ''}
                          </Text>
                          {!isMe ? (
                            <TouchableOpacity onPress={() => removeSharedUser(user.uid)}>
                              <X size={17} color="#f43f5e" />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })}

                    <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm mt-3 mb-2">
                      Pagado por
                    </Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                      {selectedUsers.map((user) => (
                        <TouchableOpacity
                          key={user.uid}
                          className={`rounded-xl px-3 py-2 ${
                            payerUid === user.uid
                              ? 'bg-indigo-600'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                          onPress={() => {
                            setPayerUid(user.uid);
                            setSharedError('');
                          }}
                        >
                          <Text className={payerUid === user.uid ? 'text-white' : 'text-slate-600 dark:text-slate-300'}>
                            {user.nombre}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm mb-2">
                      Reparto
                    </Text>
                    <View className="flex-row gap-2 mb-3">
                      {([
                        ['equal', 'Igual'],
                        ['amount', 'Montos'],
                        ['percentage', 'Porcentaje'],
                      ] as Array<[SharedSplitMode, string]>).map(([mode, label]) => (
                        <TouchableOpacity
                          key={mode}
                          className={`flex-1 rounded-xl py-2 items-center ${
                            splitMode === mode
                              ? 'bg-slate-900 dark:bg-indigo-600'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                          onPress={() => {
                            setSplitMode(mode);
                            setSharedError('');
                          }}
                        >
                          <Text className={`text-xs font-bold ${splitMode === mode ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {splitMode !== 'equal'
                      ? selectedUsers.map((user) => (
                          <View key={user.uid} className="flex-row items-center gap-3 mb-2">
                            <Text className="flex-1 text-slate-600 dark:text-slate-300 text-sm">
                              {user.nombre}
                            </Text>
                            <TextInput
                              className="w-28 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 text-right text-slate-800 dark:text-slate-100"
                              keyboardType="decimal-pad"
                              placeholder={splitMode === 'percentage' ? '0%' : '$ 0'}
                              placeholderTextColor="#94a3b8"
                              value={splitValues[user.uid] || ''}
                              onChangeText={(value) =>
                                {
                                  setSplitValues((current) => ({
                                    ...current,
                                    [user.uid]: value.replace(',', '.'),
                                  }));
                                  setSharedError('');
                                }
                              }
                            />
                          </View>
                        ))
                      : null}
                    {sharedError ? (
                      <Text className="text-rose-500 text-xs mt-2 font-semibold">
                        {sharedError}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {/* Input: Título */}
                <View className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 mb-3 shadow-sm ${
                  titleError
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}>
                  <View className="flex-row items-center mb-2">
                    <Tag size={18} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-350 font-semibold text-sm ml-2">Título</Text>
                  </View>
                  <TextInput
                    className={`bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-sm ${
                      titleError
                        ? 'border-rose-400 dark:border-rose-500'
                        : 'border-slate-100 dark:border-slate-700'
                    }`}
                    placeholder="Ej: Supermercado"
                    placeholderTextColor="#94a3b8"
                    value={title}
                    onChangeText={(value) => {
                      setTitle(value);
                      if (titleError) setTitleError('');
                    }}
                  />
                  {titleError ? (
                    <Text className="text-rose-500 text-xs mt-1.5 font-semibold">
                      {titleError}
                    </Text>
                  ) : null}
                </View>

                {/* Input: Fecha */}
                <View className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 mb-3 shadow-sm ${
                  categoryError
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}>
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
                  {categories
                    .filter((item) =>
                      type === 'income'
                        ? item.type === 'income'
                        : item.type === 'expense'
                    )
                    .map((item) => {
                      const categoryConfig = getCategoryConfig(item);
                      const Icon = categoryConfig.icon;
                      const isSelected = item.id === categoryId;

                      return (
                        <TouchableOpacity
                          key={item.id}
                          className={`rounded-2xl p-3 flex-row items-center justify-between mb-2 ${
                            isSelected
                              ? 'bg-[#0f172a] dark:bg-indigo-600'
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                          }`}
                          onPress={() => {
                            setCategoryId(item.id);
                            setCategoryError('');
                          }}
                        >
                          <View className="flex-row items-center gap-3.5">
                            <View className={`${categoryConfig.bgColor} w-10 h-10 rounded-full items-center justify-center shadow-sm`}>
                              <Icon size={20} color={categoryConfig.iconColor} />
                            </View>
                            <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {item.name}
                            </Text>
                          </View>
                          {isSelected && <Check size={18} color="white" />}
                        </TouchableOpacity>
                      );
                    })}
                  {categoryError ? (
                    <Text className="text-rose-500 text-xs mt-1 font-semibold">
                      {categoryError}
                    </Text>
                  ) : null}
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
