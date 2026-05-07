import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { BarChart3, Home, List, User } from 'lucide-react-native';

type TabKey = 'dashboard' | 'transacciones' | 'stats' | 'perfil';

const tabs: Array<{ key: TabKey; label: string; icon: typeof Home; route: string }> = [
    { key: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
    { key: 'transacciones', label: 'Transacciones', icon: List, route: '/transacciones' },
    { key: 'stats', label: 'Stats', icon: BarChart3, route: '/stats' },
    { key: 'perfil', label: 'Perfil', icon: User, route: '/perfil' },
];

export default function BottomNav({ active }: { active: TabKey }) {
    return (
        <View className="bg-white border-t border-slate-200 px-4 py-3 flex-row items-center justify-between">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === active;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        className="flex-1 items-center"
                        onPress={() => router.push(tab.route)}
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
