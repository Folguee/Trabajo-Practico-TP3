import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
    Calendar,
    LogOut,
    Mail,
    ShieldCheck,
    User,
} from 'lucide-react-native';
import SidebarLayout from '../components/SidebarLayout';
import { useAuthStore } from '../store/authStore';

export default function Perfil() {
    const user = useAuthStore((state) => state.user);

    const displayName = user?.displayName || 'Usuario';
    const email = user?.email || 'Sin email registrado';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'U';
    const creationDate = user?.metadata.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('es-AR')
        : 'No disponible';

    return (
        <SidebarLayout active="perfil">
            <View className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
                        <Text className="text-white text-3xl font-bold mb-2">Perfil</Text>
                        <Text className="text-slate-400 text-base">Datos personales y seguridad de la cuenta</Text>
                    </View>

                    <View className="px-6 -mt-16">
                        <View className="bg-[#1e293b] rounded-2xl p-6 shadow-lg shadow-slate-900/20 items-center">
                            <View className="w-24 h-24 rounded-full bg-emerald-500 items-center justify-center mb-4">
                                <Text className="text-white text-3xl font-bold">{initials}</Text>
                            </View>

                            <Text className="text-white text-2xl font-bold text-center mb-1">{displayName}</Text>
                            <Text className="text-slate-400 text-sm text-center">{email}</Text>
                        </View>
                    </View>

                    <View className="px-6 mt-8">
                        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Informacion personal</Text>

                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                            <View className="bg-slate-100 dark:bg-gray-700 w-12 h-12 rounded-full items-center justify-center mr-4">
                                <User size={22} color="#0f172a" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Nombre</Text>
                                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">{displayName}</Text>
                            </View>
                        </View>

                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                            <View className="bg-slate-100 dark:bg-gray-700 w-12 h-12 rounded-full items-center justify-center mr-4">
                                <Mail size={22} color="#0f172a" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Email</Text>
                                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">{email}</Text>
                            </View>
                        </View>

                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                            <View className="bg-slate-100 dark:bg-gray-700 w-12 h-12 rounded-full items-center justify-center mr-4">
                                <Calendar size={22} color="#0f172a" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-gray-500 text-xs mb-1">Cuenta creada</Text>
                                <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">{creationDate}</Text>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 mt-8 mb-10">
                        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Seguridad</Text>

                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-emerald-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                                    <ShieldCheck size={22} color="#10b981" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">Sesion activa</Text>
                                    <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">Tu cuenta esta conectada correctamente</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SidebarLayout>
    );
}
