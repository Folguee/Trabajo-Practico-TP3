import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function NuevoGasto() {
  useEffect(() => {
    router.replace({ pathname: '/transaction-form', params: { type: 'expense' } });
  }, []);

<<<<<<< HEAD
  return <View className="flex-1 bg-gray-50 dark:bg-gray-900" />;
=======
  return <View className="flex-1 bg-gray-50" />;
>>>>>>> origin/main
}
