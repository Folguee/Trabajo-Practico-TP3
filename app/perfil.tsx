import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
    Calendar,
    LogOut,
    Mail,
    ShieldCheck,
    User,
} from 'lucide-react-native';
import BottomNav from '../components/BottomNav';
import { logout } from '../services/auth.service';
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
                <View className="bg-[#0f172a] pt-14 pb-24 px-6 rounded-b-3xl">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-slate-400 text-base">Mi cuenta</Text>
                        <TouchableOpacity onPress={handleLogout}>
                            <LogOut size={24} color="white" />
                        </TouchableOpacity>
                    </View>

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
                    <Text className="text-slate-800 text-lg font-bold mb-4">Informacion personal</Text>

                    <View className="bg-white rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200">
                        <View className="bg-slate-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                            <User size={22} color="#0f172a" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-xs mb-1">Nombre</Text>
                            <Text className="text-slate-800 font-semibold text-base">{displayName}</Text>
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl p-4 flex-row items-center mb-3 shadow-sm shadow-slate-200">
                        <View className="bg-slate-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                            <Mail size={22} color="#0f172a" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-xs mb-1">Email</Text>
                            <Text className="text-slate-800 font-semibold text-base">{email}</Text>
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm shadow-slate-200">
                        <View className="bg-slate-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                            <Calendar size={22} color="#0f172a" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-xs mb-1">Cuenta creada</Text>
                            <Text className="text-slate-800 font-semibold text-base">{creationDate}</Text>
                        </View>
                    </View>
                </View>

                <View className="px-6 mt-8 mb-10">
                    <Text className="text-slate-800 text-lg font-bold mb-4">Seguridad</Text>

                    <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200">
                        <View className="flex-row items-center flex-1">
                            <View className="bg-emerald-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                                <ShieldCheck size={22} color="#10b981" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-800 font-semibold text-base">Sesion activa</Text>
                                <Text className="text-slate-400 text-xs mt-1">Tu cuenta esta conectada correctamente</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2"
                        onPress={handleLogout}
                    >
                        <LogOut size={20} color="white" />
                        <Text className="text-white font-semibold text-base">Cerrar sesion</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <BottomNav active="perfil" />
        </View>
    );
}
