import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Download, Home, List, User } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';

export type TabKey = 'dashboard' | 'transacciones' | 'stats' | 'exportar' | 'perfil';

const tabs: Array<{ key: TabKey; label: string; icon: typeof Home; route: string }> = [
    { key: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
    { key: 'transacciones', label: 'Transacciones', icon: List, route: '/transacciones' },
    { key: 'stats', label: 'Stats', icon: BarChart3, route: '/stats' },
    { key: 'exportar', label: 'Exportar', icon: Download, route: '/exportar' },
    { key: 'perfil', label: 'Perfil', icon: User, route: '/perfil' },
];

export default function BottomNav({
    active,
    onNavigate,
}: {
    active: TabKey;
    onNavigate: (route: string) => void;
}) {
    const insets = useSafeAreaInsets();
    const theme = useThemeStore((state) => state.theme);
    const isDark = theme === 'dark';
    const activeIconColor = isDark ? '#e2e8f0' : '#0f172a';
    const inactiveIconColor = isDark ? '#94a3b8' : '#475569';
    return (
        <View
            className="bg-white dark:bg-[#081225] border-t border-slate-200 dark:border-slate-800 px-4 pt-3 flex-row items-center justify-between"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === active;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        className="flex-1 items-center"
                        onPress={() => onNavigate(tab.route)}
                    >
                        <View
                            className={`w-12 h-12 rounded-2xl items-center justify-center border ${isActive
                                ? 'bg-slate-200 dark:bg-[#132445] border-slate-300 dark:border-slate-700'
                                : 'bg-slate-100 dark:bg-transparent border-transparent'
                                }`}
                        >
                            <Icon size={20} color={isActive ? activeIconColor : inactiveIconColor} />
                        </View>
                        <Text className={`text-xs mt-1 ${isActive ? 'text-slate-900 dark:text-slate-200 font-semibold' : 'text-slate-500'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
