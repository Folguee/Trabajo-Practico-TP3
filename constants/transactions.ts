import {
  Car,
  Coffee,
  HeartPulse,
  Home,
  MonitorSmartphone,
  ShoppingCart,
  Wallet,
} from 'lucide-react-native';
import type { Category, CategoryType } from '../types';

export const DEFAULT_CATEGORIES: Array<
  Omit<Category, 'id' | 'userId'>
> = [
  { name: 'Alimentacion', type: 'expense', color: 'rose', icon: 'shopping-cart' },
  { name: 'Transporte', type: 'expense', color: 'emerald', icon: 'car' },
  { name: 'Hogar', type: 'expense', color: 'blue', icon: 'home' },
  { name: 'Servicios', type: 'expense', color: 'purple', icon: 'monitor' },
  { name: 'Salud', type: 'expense', color: 'red', icon: 'heart-pulse' },
  { name: 'Ocio', type: 'expense', color: 'amber', icon: 'coffee' },
  { name: 'Ingresos', type: 'income', color: 'emerald', icon: 'wallet' },
];

const ICONS = {
  'shopping-cart': ShoppingCart,
  car: Car,
  home: Home,
  monitor: MonitorSmartphone,
  'heart-pulse': HeartPulse,
  coffee: Coffee,
  wallet: Wallet,
};

const COLORS: Record<string, { iconColor: string; bgColor: string }> = {
  rose: { iconColor: '#f43f5e', bgColor: 'bg-rose-100' },
  emerald: { iconColor: '#10b981', bgColor: 'bg-emerald-100' },
  blue: { iconColor: '#2563eb', bgColor: 'bg-blue-100' },
  purple: { iconColor: '#9333ea', bgColor: 'bg-purple-100' },
  red: { iconColor: '#dc2626', bgColor: 'bg-red-100' },
  amber: { iconColor: '#d97706', bgColor: 'bg-amber-100' },
};

export const getCategoryConfig = (
  category?: Pick<Category, 'icon' | 'color' | 'name'> | string
) => {
  const fallback = DEFAULT_CATEGORIES[0];
  const source =
    typeof category === 'string'
      ? DEFAULT_CATEGORIES.find((item) => item.name === category) || fallback
      : category || fallback;
  const colors = COLORS[source.color] || COLORS.rose;

  return {
    ...source,
    icon: ICONS[source.icon as keyof typeof ICONS] || ShoppingCart,
    ...colors,
  };
};

export const getDefaultCategory = (type: CategoryType) =>
  DEFAULT_CATEGORIES.find((category) => category.type === type) ||
  DEFAULT_CATEGORIES[0];
