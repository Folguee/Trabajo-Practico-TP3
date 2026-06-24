import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
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
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { logout } from '../../services/auth.service';

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
        <>
            <View className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="bg-[#0a1424] dark:bg-[#070e1b] pt-16 pb-28 px-6 rounded-b-[32px] md:pt-14 md:pb-24">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-white text-3xl font-extrabold tracking-tight mb-1">Perfil</Text>
                                <Text className="text-slate-400 text-sm">Datos personales y seguridad de la cuenta</Text>
                            </View>
                            <View className="bg-slate-900/70 dark:bg-slate-800/80 p-2.5 rounded-full border border-slate-800 hidden md:flex">
                                <User size={20} color="#38bdf8" />
                            </View>
                        </View>
                    </View>

                    <View className="px-6 -mt-16">
                        <View className="bg-white dark:bg-[#0b1730] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 items-center shadow-md shadow-slate-100 dark:shadow-none">
                            <View className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#132445] items-center justify-center mb-4 border border-slate-200/60 dark:border-slate-700/70 overflow-hidden">
                                {user?.photoURL ? (
                                    <Image
                                        source={{ uri: user.photoURL }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text className="text-slate-800 dark:text-white text-3xl font-extrabold">{initials}</Text>
                                )}
                            </View>

                            <Text className="text-slate-800 dark:text-white text-2xl font-bold text-center mb-1">{displayName}</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">{email}</Text>
                        </View>
                    </View>

                    <View className="px-6 mt-8">
                        <Text className="text-slate-800 dark:text-white text-lg font-bold mb-4">Informacion personal</Text>

                        <View className="bg-white dark:bg-[#121f33] rounded-2xl p-4 flex-row items-center mb-3 border border-slate-200/70 dark:border-slate-800/80 shadow-sm shadow-slate-100 dark:shadow-none">
                            <View className="bg-slate-100 dark:bg-[#1b2a40] w-12 h-12 rounded-full items-center justify-center mr-4">
                                <User size={22} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-slate-500 text-xs mb-1">Nombre</Text>
                                <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base">{displayName}</Text>
                            </View>
                        </View>

                        <View className="bg-white dark:bg-[#121f33] rounded-2xl p-4 flex-row items-center mb-3 border border-slate-200/70 dark:border-slate-800/80 shadow-sm shadow-slate-100 dark:shadow-none">
                            <View className="bg-slate-100 dark:bg-[#1b2a40] w-12 h-12 rounded-full items-center justify-center mr-4">
                                <Mail size={22} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-slate-500 text-xs mb-1">Email</Text>
                                <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base">{email}</Text>
                            </View>
                        </View>

                        <View className="bg-white dark:bg-[#121f33] rounded-2xl p-4 flex-row items-center border border-slate-200/70 dark:border-slate-800/80 shadow-sm shadow-slate-100 dark:shadow-none">
                            <View className="bg-slate-100 dark:bg-[#1b2a40] w-12 h-12 rounded-full items-center justify-center mr-4">
                                <Calendar size={22} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 dark:text-slate-500 text-xs mb-1">Cuenta creada</Text>
                                <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base">{creationDate}</Text>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 mt-8">
                        <Text className="text-slate-800 dark:text-white text-lg font-bold mb-4">Seguridad</Text>

                        <View className="bg-white dark:bg-[#121f33] rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-slate-200/70 dark:border-slate-800/80 shadow-sm shadow-slate-100 dark:shadow-none">
                            <View className="flex-row items-center flex-1">
                                <View className="bg-emerald-50 dark:bg-emerald-950/60 w-12 h-12 rounded-full items-center justify-center mr-4 border border-emerald-100/50 dark:border-emerald-900/70">
                                    <ShieldCheck size={22} color={theme === 'dark' ? '#6ee7b7' : '#059669'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base">Sesión activa</Text>
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">Tu cuenta está conectada correctamente</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 mt-8 mb-12">
                        <Text className="text-slate-800 dark:text-white text-lg font-bold mb-4">Opciones y Ajustes</Text>

                        <TouchableOpacity
                            className="bg-white dark:bg-[#121f33] rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-slate-200/70 dark:border-slate-800/80 shadow-sm shadow-slate-100 dark:shadow-none active:opacity-80"
                            onPress={toggleTheme}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-amber-50 dark:bg-[#1b2a40] w-12 h-12 rounded-full items-center justify-center mr-4">
                                    {theme === 'dark' ? <Sun size={22} color="#fbbf24" /> : <Moon size={22} color="#4f46e5" />}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 dark:text-slate-100 font-semibold text-base">Aspecto y Tema</Text>
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                                        Cambiar a modo {theme === 'dark' ? 'claro' : 'oscuro'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-white dark:bg-[#121f33] rounded-2xl p-4 flex-row items-center justify-between mb-3 border border-slate-200/70 dark:border-slate-800/80 shadow-sm shadow-slate-100 dark:shadow-none active:bg-rose-50 dark:active:bg-rose-950/20"
                            onPress={handleLogout}
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="bg-rose-50 dark:bg-rose-950/40 w-12 h-12 rounded-full items-center justify-center mr-4 border border-rose-100 dark:border-rose-900/50">
                                    <LogOut size={22} color={theme === 'dark' ? '#fb7185' : '#e11d48'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-rose-600 dark:text-rose-300 font-semibold text-base">Cerrar Sesión</Text>
                                    <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">Cerrar la sesión de tu cuenta</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
