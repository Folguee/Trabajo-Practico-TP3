import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
    Calendar,
    LogOut,
    Mail,
    ShieldCheck,
    User,
    Sun,
    Moon,
} from 'lucide-react-native';
import SidebarLayout from '../components/SidebarLayout';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { logout } from '../services/auth.service';

export default function Perfil() {
    const user = useAuthStore((state) => state.user);
    const { theme, toggleTheme } = useThemeStore();

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/');
        } catch {
            router.replace('/');
        }
    };

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
                    <View className="bg-[#0f172a] pt-16 pb-28 px-6 rounded-b-[32px] md:pt-14 md:pb-24 shadow-sm">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-white text-3xl font-extrabold tracking-tight mb-1">Perfil</Text>
                                <Text className="text-slate-400 text-sm">Datos personales y seguridad de la cuenta</Text>
                            </View>
                            <View className="bg-slate-800/80 p-2.5 rounded-full border border-slate-700/50 hidden md:flex">
                                <User size={20} color="#818cf8" />
                            </View>
                        </View>
                    </View>

                    <View className="px-6 -mt-16">
                        <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl items-center">
                            <View className="w-24 h-24 rounded-full bg-[#0f172a] dark:bg-indigo-600 items-center justify-center mb-4 shadow-sm">
                                <Text className="text-white text-3xl font-extrabold">{initials}</Text>
                            </View>

                            <Text className="text-slate-800 dark:text-slate-100 text-2xl font-bold text-center mb-1">{displayName}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">{email}</Text>
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

                    <View className="px-6 mt-8">
                        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Seguridad</Text>

                        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-emerald-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                                    <ShieldCheck size={22} color="#10b981" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">Sesión activa</Text>
                                    <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">Tu cuenta está conectada correctamente</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 mt-8 mb-12">
                        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Opciones y Ajustes</Text>

                        {/* Selector de Tema */}
                        <TouchableOpacity
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 active:opacity-80"
                            onPress={toggleTheme}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-full items-center justify-center mr-4">
                                    {theme === 'dark' ? <Sun size={22} color="#f59e0b" /> : <Moon size={22} color="#6366f1" />}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 dark:text-gray-100 font-semibold text-base">Aspecto y Tema</Text>
                                    <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">
                                        Cambiar a modo {theme === 'dark' ? 'claro' : 'oscuro'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Cerrar Sesión */}
                        <TouchableOpacity
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-3 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 active:bg-rose-50 dark:active:bg-rose-950/20"
                            onPress={handleLogout}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-rose-100 dark:bg-rose-950/40 w-12 h-12 rounded-full items-center justify-center mr-4">
                                    <LogOut size={22} color="#ef4444" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-rose-500 font-semibold text-base">Cerrar Sesión</Text>
                                    <Text className="text-slate-400 dark:text-gray-500 text-xs mt-1">Cerrar la sesión de tu cuenta</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SidebarLayout>
    );
}
