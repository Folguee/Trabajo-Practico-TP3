import { useLocalSearchParams, router } from 'expo-router';
import TransactionFormSheet from '../components/TransactionFormSheet';

export default function TransactionFormScreen() {
  const { type, id } = useLocalSearchParams<{ type?: string; id?: string }>();
  const initialType = type === 'income' ? 'income' : 'expense';

  return (
    <TransactionFormSheet
      visible
      transactionId={id ?? null}
      initialType={initialType}
      onClose={() => router.back()}
      onSaveSuccess={() => router.back()}
    />
  );
}
