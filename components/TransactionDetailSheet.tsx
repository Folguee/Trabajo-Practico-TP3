import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Download,
  FileText,
  Hash,
  Pencil,
  Tag,
  Trash2,
  X,
} from 'lucide-react-native';
import { getCategoryConfig } from '../constants/transactions';
import { formatCurrency } from '../utils/money';
import { formatDisplayDate } from '../utils/date';
import SharedExpenseDetail from './SharedExpenseDetail';
import type { Transaction } from '../services/transaction.service';
import type { Category } from '../types';

type TransactionDetailSheetProps = {
  visible: boolean;
  transaction: Transaction | null;
  currentUserUid?: string;
  categories?: Category[];
  isDeleting: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: () => void;
};

export default function TransactionDetailSheet({
  visible,
  transaction,
  currentUserUid,
  categories,
  isDeleting,
  onClose,
  onEdit,
  onExport,
  onDelete,
}: TransactionDetailSheetProps) {
  return (
    <Modal
      visible={visible && transaction !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 justify-end md:justify-center md:items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-white dark:bg-slate-900 rounded-t-[36px] px-6 pb-8 pt-2 border-t border-slate-200 dark:border-slate-800 md:max-w-xl md:w-full md:rounded-3xl md:shadow-2xl md:border"
          style={{ maxHeight: Dimensions.get('window').height * 0.85 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Barra superior de arrastre */}
          <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 mt-1" />

          {transaction &&
            (() => {
              const categorySource = categories
                ? categories.find((entry) => entry.id === transaction.categoryId) ??
                  transaction.categoryName
                : transaction.categoryName;
              const category = getCategoryConfig(categorySource);
              const Icon = category.icon;
              const isExpense =
                transaction.type === 'expense' || transaction.type === 'shared';
              const isShared = transaction.type === 'shared';
              const canManage = !isShared || transaction.creatorUid === currentUserUid;

              return (
                <View className="w-full">
                  {/* Encabezado del Modal */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-slate-800 dark:text-slate-100 text-lg font-bold">
                      Detalle del Movimiento
                    </Text>
                    <TouchableOpacity
                      className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"
                      onPress={onClose}
                    >
                      <X size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="mb-4"
                    style={{ flexShrink: 1 }}
                  >
                    {/* Tarjeta de Resumen */}
                    <View className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 items-center border border-slate-100 dark:border-slate-800 mb-6">
                      <View
                        className={`${category.bgColor} w-16 h-16 rounded-full items-center justify-center mb-3`}
                      >
                        <Icon size={28} color={category.iconColor} />
                      </View>
                      <Text className="text-slate-800 dark:text-slate-100 text-xl font-bold text-center mb-1">
                        {transaction.title}
                      </Text>
                      <Text
                        className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} text-3xl font-extrabold`}
                      >
                        {formatCurrency(transaction.amount, {
                          sign: isExpense ? 'negative' : 'positive',
                        })}
                      </Text>
                    </View>

                    {/* Fila: ID */}
                    <View className="flex-row items-center gap-3.5 mb-3 px-1">
                      <View className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                        <Hash size={18} color="#64748b" />
                      </View>
                      <View>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs">ID</Text>
                        <Text
                          className="text-slate-800 dark:text-slate-100 font-semibold text-sm"
                          selectable
                        >
                          {transaction.id}
                        </Text>
                      </View>
                    </View>

                    {/* Fila: Categoría */}
                    <View className="flex-row items-center gap-3.5 mb-3 px-1">
                      <View className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                        <Tag size={18} color="#64748b" />
                      </View>
                      <View>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs">
                          Tipo y Categoría
                        </Text>
                        <Text className="text-slate-800 dark:text-slate-100 font-semibold text-sm">
                          {isShared ? 'Compartido' : isExpense ? 'Gasto' : 'Ingreso'} -{' '}
                          {transaction.categoryName}
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
                          {formatDisplayDate(transaction.date)}
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
                          {transaction.note || 'Sin nota cargada.'}
                        </Text>
                      </View>
                    </View>

                    {/* Detalle Compartido */}
                    <SharedExpenseDetail
                      transaction={transaction}
                      currentUserUid={currentUserUid}
                    />

                    {/* Imagen adjunta */}
                    {transaction.imageUrl && (
                      <View className="mt-2 mb-4 px-1">
                        <Text className="text-slate-400 dark:text-slate-500 text-xs mb-2">
                          Imagen Adjunta
                        </Text>
                        <Image
                          source={{ uri: transaction.imageUrl }}
                          className="w-full h-40 rounded-2xl border border-slate-100 dark:border-slate-800"
                        />
                      </View>
                    )}
                  </ScrollView>

                  {/* Acciones del Modal */}
                  <View className="flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {canManage ? (
                      <TouchableOpacity
                        className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                        onPress={() => transaction.id && onEdit(transaction.id)}
                      >
                        <Pencil size={16} color="#475569" />
                        <Text className="text-slate-700 dark:text-slate-350 font-bold text-sm">
                          Editar
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                      onPress={() => transaction.id && onExport(transaction.id)}
                    >
                      <Download size={16} color="#475569" />
                      <Text className="text-slate-700 dark:text-slate-350 font-bold text-sm">
                        Exportar
                      </Text>
                    </TouchableOpacity>

                    {canManage ? (
                      <TouchableOpacity
                        className="bg-rose-500 active:bg-rose-600 rounded-xl p-3 flex-1 flex-row items-center justify-center gap-1.5"
                        onPress={onDelete}
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
  );
}