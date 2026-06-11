import { View, Text, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { logout } from '../services/auth.service';
import { Home, List, BarChart3, User, LogOut } from 'lucide-react-native';

type TabKey = 'dashboard' | 'transacciones' | 'stats' | 'perfil';

const sidebarTabs: Array<{ key: TabKey; label: string; icon: typeof Home; route: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
  { key: 'transacciones', label: 'Transacciones', icon: List, route: '/transacciones' },
  { key: 'stats', label: 'Stats', icon: BarChart3, route: '/stats' },
  { key: 'perfil', label: 'Perfil', icon: User, route: '/perfil' },
];

const BG_URL =
  'https://cdn.forbes.com.mx/2023/12/digitalizar_finanzas_personales.jpg';

export default function SidebarLayout({ active, children }: { active: TabKey; children: React.ReactNode }) {
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
      <View className="w-48 bg-white pt-14 pb-8 px-3 items-center border-r border-gray-200">
        <Image
          source={{ uri: 'https://marketplace.canva.com/EAE3ErRzI6g/1/0/1600w/canva-people-dollar-logo%2C-money-finances-logo-gdfxtb4mf80.jpg' }}
          className="w-20 h-20 mb-8"
          resizeMode="contain"
        />

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
                <Text className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-slate-600'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          className="flex-row items-center gap-3 px-3 py-3 w-full rounded-xl"
          onPress={handleLogout}
        >
          <LogOut size={20} color="#64748b" />
          <Text className="text-slate-600 text-sm">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      <ImageBackground
        source={{ uri: BG_URL }}
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
