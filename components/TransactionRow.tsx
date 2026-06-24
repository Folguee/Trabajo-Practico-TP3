/// <reference types="nativewind/types" />
import { View, Text, TouchableOpacity } from 'react-native';
import { getCategoryConfig } from '../constants/transactions';
import { formatCurrency } from '../utils/money';
import { formatDisplayDate } from '../utils/date';
import { Transaction } from '../services/transaction.service';

interface TransactionRowProps {
  item: Transaction;
  onPress: (item: Transaction) => void;
}

export default function TransactionRow({ item, onPress }: TransactionRowProps) {
  const category = getCategoryConfig(item.categoryName);
  const Icon = category.icon;
  const isExpense = item.type === 'expense' || item.type === 'shared';

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm active:opacity-90"
      onPress={() => onPress(item)}
    >
      <View className="flex-row items-center gap-3.5 flex-1 mr-4">
        <View className={`${category.bgColor} w-11 h-11 rounded-xl items-center justify-center`}>
          <Icon size={20} color={category.iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base" numberOfLines={1}>
            {item.title}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Text className="text-slate-400 dark:text-slate-500 text-xs">
              {formatDisplayDate(item.date)}
            </Text>
            <Text className="text-slate-300 dark:text-slate-700 text-xs">•</Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs" numberOfLines={1}>
              {item.categoryName}
            </Text>
          </View>
        </View>
      </View>

      <View className="items-end">
        <Text className={`font-bold text-base ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
          {formatCurrency(item.amount, { sign: isExpense ? 'negative' : 'positive' })}
        </Text>
        {item.type === 'shared' && (
          <Text className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">
            Compartido
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}