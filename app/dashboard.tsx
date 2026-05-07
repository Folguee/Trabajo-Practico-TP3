import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth.service';
import { Plus, ShoppingCart, Car, Coffee, LogOut } from 'lucide-react-native';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header Background */}
        <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={handleLogout}>
              <LogOut size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-3xl font-bold mb-2">Control de Gastos</Text>
          <Text className="text-slate-400 text-base">Gestiona tus finanzas personales</Text>
        </View>

        {/* Resumen de Saldos Card (Overlapping) */}
        <View className="px-6 -mt-16">
          <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20">
            <Text className="text-white text-lg font-bold mb-2">Resumen de Saldos</Text>
            <Text className="text-[#10b981] text-4xl font-bold mb-6 text-center tracking-tight">$10b981</Text>

            <View className="flex-row items-center justify-between border-t border-slate-700 pt-4">
              <View className="flex-1 items-center border-r border-slate-700">
                <Text className="text-emerald-500/80 text-sm mb-1">Ingresos</Text>
                <Text className="text-emerald-400 font-bold">+ $0.00</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-rose-500/80 text-sm mb-1">Gastos</Text>
                <Text className="text-rose-400 font-bold">- $0.00</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View className="px-6 mt-8">
          <Text className="text-slate-800 text-lg font-bold mb-4">Acciones Rápidas</Text>

          <TouchableOpacity className="bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2 mb-3">
            <Plus size={20} color="white" />
            <Text className="text-white font-semibold text-base">Nuevo Ingreso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2"
            onPress={() => router.push('/nuevo-gasto')}
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-semibold text-base">Nuevo Gasto</Text>
          </TouchableOpacity>
        </View>

        {/* Transacciones Recientes */}
        <View className="px-6 mt-8 mb-10">
          <Text className="text-slate-800 text-lg font-bold mb-4">Transacciones Recientes</Text>

          {/* Transaction 1 */}
          <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center gap-4">
              <View className="bg-rose-100 w-12 h-12 rounded-full items-center justify-center">
                <ShoppingCart size={24} color="#f43f5e" />
              </View>
              <View>
                <Text className="text-slate-800 font-semibold text-base">Supermercado</Text>
                <Text className="text-slate-400 text-xs mt-1">28/05/2024</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-rose-500 font-bold text-base">$15.50</Text>
              <Text className="text-slate-400 text-xs mt-1">Alimentación</Text>
            </View>
          </View>

          {/* Transaction 2 */}
          <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center gap-4">
              <View className="bg-emerald-100 w-12 h-12 rounded-full items-center justify-center">
                <Car size={24} color="#10b981" />
              </View>
              <View>
                <Text className="text-slate-800 font-semibold text-base">Taxi al centro</Text>
                <Text className="text-slate-400 text-xs mt-1">29/05/2024</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[#10b981] font-bold text-base">$100.00</Text>
              <Text className="text-slate-400 text-xs mt-1">Transporte</Text>
            </View>
          </View>

          {/* Transaction 3 */}
          <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200">
            <View className="flex-row items-center gap-4">
              <View className="bg-amber-100 w-12 h-12 rounded-full items-center justify-center">
                <Coffee size={24} color="#d97706" />
              </View>
              <View>
                <Text className="text-slate-800 font-semibold text-base">Coffee cup</Text>
                <Text className="text-slate-400 text-xs mt-1">28/08/2024</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[#10b981] font-bold text-base">$100.00</Text>
              <Text className="text-slate-400 text-xs mt-1">Alimentación</Text>
            </View>
          </View>

        </View>
      </ScrollView>
      <BottomNav active="dashboard" />
    </View>
  );
}
