import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Car,
  Coffee,
  HeartPulse,
  Home,
  MonitorSmartphone,
  ShoppingCart,
  Tag,
} from 'lucide-react-native';
import { addTransaction } from '../services/transaction.service';
import { useAuthStore } from '../store/authStore';

const categories = [
  {
    name: 'Alimentacion',
    icon: ShoppingCart,
    iconColor: '#f43f5e',
    bgColor: 'bg-rose-100',
  },
  {
    name: 'Transporte',
    icon: Car,
    iconColor: '#10b981',
    bgColor: 'bg-emerald-100',
  },
  {
    name: 'Hogar',
    icon: Home,
    iconColor: '#2563eb',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Servicios',
    icon: MonitorSmartphone,
    iconColor: '#9333ea',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Salud',
    icon: HeartPulse,
    iconColor: '#dc2626',
    bgColor: 'bg-red-100',
  },
  {
    name: 'Ocio',
    icon: Coffee,
    iconColor: '#d97706',
    bgColor: 'bg-amber-100',
  },
];

const formatDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function NuevoGasto() {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0].name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!title.trim() || !date.trim() || !amount.trim() || !category) {
      Alert.alert('Datos incompletos', 'Completa gasto, fecha, monto y categoria.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto invalido', 'Ingresa un monto mayor a cero.');
      return;
    }

    if (!user) {
      Alert.alert('Sesion requerida', 'Inicia sesion para cargar un gasto.');
      router.replace('/login');
      return;
    }

    try {
      setIsSaving(true);
      await addTransaction({
        type: 'expense',
        title: title.trim(),
        date: date.trim(),
        amount: parsedAmount,
        category,
        userId: user.uid,
      });
      router.replace('/dashboard');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el gasto. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
          <TouchableOpacity className="mb-6" onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold mb-2">Nuevo Gasto</Text>
          <Text className="text-slate-400 text-base">Carga el detalle del movimiento</Text>
        </View>

        <View className="px-6 -mt-16">
          <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20">
            <Text className="text-white text-lg font-bold mb-2">Monto del gasto</Text>
            <View className="flex-row items-center justify-center">
              <DollarSign size={32} color="#fb7185" />
              <TextInput
                className="text-rose-400 text-4xl font-bold tracking-tight min-w-[140px]"
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-slate-800 text-lg font-bold mb-4">Detalle</Text>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <Tag size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Gasto</Text>
            </View>
            <View className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-row items-center gap-3">
              <View className="bg-rose-100 w-10 h-10 rounded-full items-center justify-center">
                <ShoppingCart size={20} color="#f43f5e" />
              </View>
              <TextInput
                className="flex-1 text-slate-800 text-base"
                placeholder="Ej: Supermercado"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-2">
              <Calendar size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Cuando</Text>
            </View>
            <View className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-row items-center gap-3">
              <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center">
                <Calendar size={20} color="#2563eb" />
              </View>
              <TextInput
                className="flex-1 text-slate-800 text-base"
                keyboardType="number-pad"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
                value={date}
                onChangeText={(value) => setDate(formatDateInput(value))}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200">
            <View className="flex-row items-center mb-3">
              <Tag size={20} color="#0f172a" />
              <Text className="text-slate-800 font-semibold text-base ml-2">Categoria</Text>
            </View>

            <View>
              {categories.map((item) => {
                const Icon = item.icon;
                const isSelected = item.name === category;

                return (
                  <TouchableOpacity
                    key={item.name}
                    className={`rounded-2xl p-4 flex-row items-center justify-between mb-3 ${
                      isSelected ? 'bg-slate-950' : 'bg-slate-50 border border-slate-100'
                    }`}
                    onPress={() => setCategory(item.name)}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className={`${item.bgColor} w-12 h-12 rounded-full items-center justify-center`}>
                        <Icon size={24} color={item.iconColor} />
                      </View>
                      <Text className={`font-semibold text-base ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color="white" />}
                  </TouchableOpacity>
                );
              })}
            </View>
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
              {isSaving ? 'Guardando...' : 'Guardar gasto'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
