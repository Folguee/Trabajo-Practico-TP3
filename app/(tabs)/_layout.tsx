/**
 * Layout compartido de las pestañas principales.
 *
 * Renderiza SidebarLayout (que contiene el BottomNav en mobile y el sidebar en
 * desktop) UNA sola vez alrededor de un <Slot/>. Así la barra de navegación
 * permanece montada y fija al cambiar de pantalla, en vez de re-montarse en
 * cada navegación (que causaba el "parpadeo").
 */

import { Slot, usePathname } from 'expo-router';
import SidebarLayout from '../../components/SidebarLayout';
import type { TabKey } from '../../components/BottomNav';

function activeFromPath(pathname: string): TabKey {
  if (pathname.startsWith('/transacciones')) return 'transacciones';
  if (pathname.startsWith('/stats')) return 'stats';
  if (pathname.startsWith('/exportar')) return 'exportar';
  if (pathname.startsWith('/perfil')) return 'perfil';
  return 'dashboard';
}

export default function TabsLayout() {
  const pathname = usePathname();
  const active = activeFromPath(pathname);

  return (
    <SidebarLayout active={active}>
      <Slot />
    </SidebarLayout>
  );
}
