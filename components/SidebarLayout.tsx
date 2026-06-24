import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Home, List, BarChart3, User, LogOut, Moon, Sun, Download } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { logout } from '../services/auth.service';
import BottomNav, { TabKey } from './BottomNav';

const sidebarTabs: Array<{ key: TabKey; label: string; icon: typeof Home; route: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
  { key: 'transacciones', label: 'Transacciones', icon: List, route: '/transacciones' },
  { key: 'stats', label: 'Stats', icon: BarChart3, route: '/stats' },
  { key: 'exportar', label: 'Exportar', icon: Download, route: '/exportar' },
  { key: 'perfil', label: 'Perfil', icon: User, route: '/perfil' },
];

type SidebarLayoutProps = {
  active: TabKey;
  children: React.ReactNode;
  onNavigate?: (route: string) => void;
  onLogout?: () => void | Promise<void>;
};

export default function SidebarLayout({
  active,
  children,
  onNavigate,
  onLogout,
}: SidebarLayoutProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
      return;
    }
    router.push(route as any);
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    try {
      await logout();
    } finally {
      router.replace('/');
    }
  };

  return (
    <View className="flex-1 flex-row bg-slate-50 dark:bg-slate-950">
      {!isMobile && (
        <View className="w-56 bg-white dark:bg-slate-900 pt-14 pb-8 px-4 items-center border-r border-slate-200 dark:border-slate-800">
          <View className="w-full mb-8 px-2">
            <Text className="text-[#0f172a] dark:text-white text-xl font-extrabold tracking-tight">
              Mis Finanzas
            </Text>
          </View>

          <View className="w-full flex-1 gap-1">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.key === active;
              return (
                <TouchableOpacity
                  key={tab.key}
                  className={`flex-row items-center gap-3 px-3 py-3 rounded-xl ${
                    isActive ? 'bg-[#0f172a] dark:bg-indigo-600' : 'active:bg-slate-100 dark:active:bg-slate-800'
                  }`}
                  onPress={() => handleNavigate(tab.route)}
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
            className="flex-row items-center gap-3 px-3 py-3 w-full rounded-xl mb-2 active:bg-slate-100 dark:active:bg-slate-800"
            onPress={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} color="#64748b" /> : <Moon size={20} color="#64748b" />}
            <Text className="text-slate-600 dark:text-gray-400 text-sm font-medium">
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-3 px-3 py-3 w-full rounded-xl active:bg-rose-50 dark:active:bg-rose-950/20"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#f43f5e" />
            <Text className="text-rose-500 font-semibold text-sm">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-1 flex-col">
        <View className="flex-1">{children}</View>
        {isMobile && <BottomNav active={active} onNavigate={handleNavigate} />}
      </View>
    </View>
  );
}