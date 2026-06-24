import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Download, Home, List, User } from 'lucide-react-native';

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
    return (
        <View
            className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pt-3 flex-row items-center justify-between"
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
                            className={`w-12 h-12 rounded-2xl items-center justify-center ${isActive ? 'bg-slate-950' : 'bg-slate-100'
                                }`}
                        >
                            <Icon size={20} color={isActive ? 'white' : '#475569'} />
                        </View>
                        <Text className={`text-xs mt-1 ${isActive ? 'text-slate-950 font-semibold' : 'text-slate-500'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
