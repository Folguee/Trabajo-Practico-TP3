import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import TransactionFormSheet from '../components/TransactionFormSheet';

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function TransactionFormScreen() {
  const params = useLocalSearchParams();
  const [visible, setVisible] = useState(true);
  const id = getParam(params.id);
  const initialType = getParam(params.type) === 'income' ? 'income' : 'expense';

  const close = () => {
    setVisible(false);
    if (id) {
      router.replace({ pathname: '/transaction-detail', params: { id } });
    } else {
      router.replace('/transacciones');
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <TransactionFormSheet
        visible={visible}
        transactionId={id ? Number(id) : null}
        initialType={initialType}
        onClose={close}
        onSaveSuccess={() => undefined}
      />
    </View>
  );
}
