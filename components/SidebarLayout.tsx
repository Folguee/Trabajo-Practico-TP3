import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { logout } from '../services/auth.service';
import { Home, List, BarChart3, User, LogOut, Moon, Sun } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';

type TabKey = 'dashboard' | 'transacciones' | 'stats' | 'perfil';

const sidebarTabs: Array<{ key: TabKey; label: string; icon: typeof Home; route: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
  { key: 'transacciones', label: 'Transacciones', icon: List, route: '/transacciones' },
  { key: 'stats', label: 'Stats', icon: BarChart3, route: '/stats' },
  { key: 'perfil', label: 'Perfil', icon: User, route: '/perfil' },
];

const BG_IMG = require('../assets/fondo.jpg');

export default function SidebarLayout({ active, children }: { active: TabKey; children: React.ReactNode }) {
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 flex-row">
      <View className="w-48 bg-white dark:bg-gray-900 pt-14 pb-8 px-3 items-center border-r border-gray-200 dark:border-gray-800">

        <View className="w-full flex-1 gap-1">
          {sidebarTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === active;
            return (
              <TouchableOpacity
                key={tab.key}
                className={`flex-row items-center gap-3 px-3 py-3 rounded-xl ${isActive ? 'bg-[#0f172a]' : ''}`}
                onPress={() => router.push(tab.route)}
              >
                <Icon size={20} color={isActive ? 'white' : '#64748b'} />
                <Text className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-slate-600 dark:text-gray-400'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          className="flex-row items-center gap-3 px-3 py-3 w-full rounded-xl mb-2"
          onPress={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={20} color="#64748b" /> : <Moon size={20} color="#64748b" />}
          <Text className="text-slate-600 dark:text-gray-400 text-sm">
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-3 px-3 py-3 w-full rounded-xl"
          onPress={handleLogout}
        >
          <LogOut size={20} color="#64748b" />
          <Text className="text-slate-600 dark:text-gray-400 text-sm">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      <ImageBackground
        source={BG_IMG}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/50">
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}
