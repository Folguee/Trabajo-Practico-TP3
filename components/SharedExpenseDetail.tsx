import { Text, View } from 'react-native';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/money';

type Props = {
  transaction: Transaction;
  currentUserUid?: string;
};

export default function SharedExpenseDetail({
  transaction,
  currentUserUid,
}: Props) {
  if (transaction.type !== 'shared' || !transaction.participants) return null;

  const payer = transaction.participants.find(
    (participant) => participant.uid === transaction.payerUid
  );

  return (
    <View className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
      <Text className="text-slate-800 dark:text-slate-100 font-bold text-sm mb-2">
        Detalle compartido
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-xs">Total original</Text>
      <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">
        {formatCurrency(transaction.totalAmount || 0)}
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mb-3">
        Pagado por {payer?.uid === currentUserUid ? 'mí' : payer?.nombre || 'Usuario'}
      </Text>

      {transaction.participants.map((participant) => (
        <View
          key={participant.uid}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl mb-2"
        >
          <View className="flex-row justify-between gap-3">
            <Text className="text-slate-700 dark:text-slate-300 text-xs flex-1">
              {participant.uid === currentUserUid ? 'Yo' : participant.nombre}
            </Text>
            <Text className="text-slate-800 dark:text-slate-100 text-xs font-bold">
              {formatCurrency(participant.amount)}
              {' · '}
              {Number(participant.percentage.toFixed(2))}%
            </Text>
          </View>
          {participant.uid !== transaction.payerUid && participant.amount > 0 ? (
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Debe {formatCurrency(participant.amount)} a{' '}
              {payer?.uid === currentUserUid ? 'mí' : payer?.nombre || 'quien pagó'}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
