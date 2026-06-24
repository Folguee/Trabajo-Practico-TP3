import { View, Text } from 'react-native';

export default function TransactionFormScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
      <Text className="text-slate-900 dark:text-slate-100 text-lg font-semibold text-center">
        Formulario temporalmente deshabilitado
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
        Esta pantalla se reactivará cuando terminemos de estabilizar la navegación.
      </Text>
    </View>
  );
}