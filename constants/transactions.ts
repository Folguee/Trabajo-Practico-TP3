import {
  Car,
  Coffee,
  HeartPulse,
  Home,
  MonitorSmartphone,
  ShoppingCart,
  Wallet,
} from 'lucide-react-native';

export const transactionCategories = [
  {
    name: 'Alimentacion',
    icon: ShoppingCart,
    iconColor: '#f43f5e',
    bgColor: 'bg-rose-100',
  },
  {
    name: 'Transporte',
    icon: Car,
    iconColor: '#10b981',
    bgColor: 'bg-emerald-100',
  },
  {
    name: 'Hogar',
    icon: Home,
    iconColor: '#2563eb',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Servicios',
    icon: MonitorSmartphone,
    iconColor: '#9333ea',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Salud',
    icon: HeartPulse,
    iconColor: '#dc2626',
    bgColor: 'bg-red-100',
  },
  {
    name: 'Ocio',
    icon: Coffee,
    iconColor: '#d97706',
    bgColor: 'bg-amber-100',
  },
  {
    name: 'Ingresos',
    icon: Wallet,
    iconColor: '#059669',
    bgColor: 'bg-emerald-100',
  },
];

export const getCategoryConfig = (category?: string) => {
  return (
    transactionCategories.find((item) => item.name === category) ||
    transactionCategories[0]
  );
};

export const formatDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const parseTransactionDate = (value?: string) => {
  if (!value) return null;

  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return null;

  const parsedDate = new Date(year, month - 1, day);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate;
};
