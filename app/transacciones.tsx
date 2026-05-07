import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import {
    ArrowLeft,
    ShoppingCart,
    Car,
    Coffee,
    Search,
    Filter,
    Utensils,
    Home,
    MonitorSmartphone,
    ChevronDown
} from 'lucide-react-native';

import BottomNav from '../components/BottomNav';

export default function Transacciones() {
    return (
        <View className="flex-1 bg-gray-50">

            {/* Header Background */}
            <View className="bg-[#0f172a] pt-14 pb-20 px-6 rounded-b-3xl">
                <View className="flex-row justify-between items-center mb-6">
                    {/* Opcional: botón atrás o menú */}
                    <TouchableOpacity>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <Text className="text-white text-3xl font-bold mb-2">Transacciones</Text>
                <Text className="text-slate-400 text-base">Revisa tus movimientos</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

                {/* Barra de búsqueda y filtros flotante */}
                <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200 mb-6 flex-row gap-3">
                    <View className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-row items-center gap-2">
                        <Search size={20} color="#94a3b8" />
                        <TextInput
                            placeholder="Buscar transacción..."
                            placeholderTextColor="#94a3b8"
                            className="flex-1 text-slate-800 text-base"
                        />
                    </View>
                    <TouchableOpacity className="bg-[#0f172a] w-12 h-12 rounded-xl items-center justify-center">
                        <Filter size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Fechas o separadores (ej. Mayo 2024) */}
                <View className="flex-row justify-between items-center mb-4 mt-2">
                    <Text className="text-slate-800 text-lg font-bold">Mayo 2024</Text>
                    <TouchableOpacity className="flex-row items-center gap-1 bg-slate-200/50 px-3 py-1.5 rounded-full">
                        <Text className="text-slate-600 font-medium text-sm">Este Mes</Text>
                        <ChevronDown size={16} color="#475569" />
                    </TouchableOpacity>
                </View>

                {/* Lista de Transacciones */}

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

                {/* Transaction 4 */}
                <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200">
                    <View className="flex-row items-center gap-4">
                        <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center">
                            <Home size={24} color="#2563eb" />
                        </View>
                        <View>
                            <Text className="text-slate-800 font-semibold text-base">Alquiler</Text>
                            <Text className="text-slate-400 text-xs mt-1">01/05/2024</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-rose-500 font-bold text-base">-$400.00</Text>
                        <Text className="text-slate-400 text-xs mt-1">Hogar</Text>
                    </View>
                </View>

                {/* Transaction 5 */}
                <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200">
                    <View className="flex-row items-center gap-4">
                        <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center">
                            <MonitorSmartphone size={24} color="#9333ea" />
                        </View>
                        <View>
                            <Text className="text-slate-800 font-semibold text-base">Internet</Text>
                            <Text className="text-slate-400 text-xs mt-1">10/05/2024</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-rose-500 font-bold text-base">-$30.00</Text>
                        <Text className="text-slate-400 text-xs mt-1">Servicios</Text>
                    </View>
                </View>

                {/* Espacio final para que no quede tapado por la barra de navegación (si la hay) */}
                <View className="h-10" />
            </ScrollView>

            <BottomNav active="transacciones" />
        </View>
    );
}