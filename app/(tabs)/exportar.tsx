import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Download, CalendarDays } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeFocusEffect } from '../../utils/useSafeFocusEffect';
import { getTransactions, Transaction } from '../../services/transaction.service';
import { generateAndDownloadCSV } from '../../services/export.service';
import {
  endOfDay,
  formatDateInput,
  formatDisplayDate,
  parseDateInput,
  startOfDay,
} from '../../utils/date';
import { formatCurrency } from '../../utils/money';

type DateTarget = 'start' | 'end' | null;

export default function Exportar() {
  const { transactionId } = useLocalSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState(new Date());
  const [startInput, setStartInput] = useState(formatDisplayDate(startDate));
  const [endInput, setEndInput] = useState(formatDisplayDate(endDate));
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setTransactions(await getTransactions());
    } catch (error) {
      Alert.alert(
        'Error de conexion',
        error instanceof Error ? error.message : 'No se pudieron cargar los movimientos.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useSafeFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const selectedTransaction = useMemo(
    () =>
      transactionId
        ? transactions.find(
            (transaction) => String(transaction.id) === String(transactionId)
          )
        : undefined,
    [transactionId, transactions]
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.date >= startOfDay(startDate) &&
          transaction.date <= endOfDay(endDate)
      ),
    [endDate, startDate, transactions]
  );

  const reportTransactions = selectedTransaction
    ? [selectedTransaction]
    : filteredTransactions;
  const income = reportTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = reportTransactions
    .filter((transaction) => transaction.type !== 'income')
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  const setDate = (target: Exclude<DateTarget, null>, date: Date) => {
    if (target === 'start') {
      setStartDate(date);
      setStartInput(formatDisplayDate(date));
    } else {
      setEndDate(date);
      setEndInput(formatDisplayDate(date));
    }
  };

  const handleNativeDate = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    const target = dateTarget;
    setDateTarget(Platform.OS === 'ios' ? target : null);
    if (event.type === 'set' && selected && target) setDate(target, selected);
  };

  const commitWebDate = (
    target: Exclude<DateTarget, null>,
    value: string
  ) => {
    const parsed = parseDateInput(value);
    if (parsed) setDate(target, parsed);
  };

  const handleExport = async () => {
    const exportStart =
      Platform.OS === 'web' ? parseDateInput(startInput) : startDate;
    const exportEnd =
      Platform.OS === 'web' ? parseDateInput(endInput) : endDate;

    if (!exportStart || !exportEnd) {
      Alert.alert(
        'Fecha invalida',
        'Completa ambas fechas con el formato DD/MM/AAAA.'
      );
      return;
    }
    if (exportStart > exportEnd) {
      Alert.alert('Rango invalido', 'La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }

    const transactionsToExport = selectedTransaction
      ? [selectedTransaction]
      : transactions.filter(
          (transaction) =>
            transaction.date >= startOfDay(exportStart) &&
            transaction.date <= endOfDay(exportEnd)
        );
    if (!transactionsToExport.length) {
      Alert.alert('Sin resultados', 'No hay movimientos para exportar.');
      return;
    }

    try {
      setIsExporting(true);
      const result = await generateAndDownloadCSV(
        transactionsToExport,
        `${selectedTransaction ? 'movimiento' : 'reporte'}-${Date.now()}.csv`
      );
      Alert.alert(
        'Exportacion completa',
        result === 'shared'
          ? 'Se abrio el menu para compartir el CSV.'
          : 'El archivo CSV fue descargado.'
      );
    } catch (error) {
      Alert.alert(
        'Error al exportar',
        error instanceof Error ? error.message : 'No se pudo generar el CSV.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const DateField = ({
    label,
    target,
    value,
    onChange,
  }: {
    label: string;
    target: Exclude<DateTarget, null>;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <View className="flex-1">
      <Text className="text-slate-500 text-xs font-bold mb-2">{label}</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-slate-800 dark:text-white"
          value={value}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          onChangeText={(text) => onChange(formatDateInput(text))}
          onBlur={() => commitWebDate(target, value)}
        />
      ) : (
        <TouchableOpacity
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3"
          onPress={() => setDateTarget(target)}
        >
          <Text className="text-slate-800 dark:text-white">{value}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="bg-[#0f172a] pt-16 pb-24 px-6 rounded-b-[32px]">
          <Text className="text-white text-3xl font-extrabold">Exportar</Text>
          <Text className="text-slate-400 mt-1">Genera y comparte reportes CSV</Text>
        </View>

        <View className="px-6 -mt-14 pb-12 gap-5">
          {!selectedTransaction && (
            <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg">
              <View className="flex-row items-center gap-2 mb-4">
                <CalendarDays size={20} color="#475569" />
                <Text className="text-slate-800 dark:text-white text-lg font-bold">Rango de fechas</Text>
              </View>
              <View className="flex-row gap-3">
                <DateField label="DESDE" target="start" value={startInput} onChange={setStartInput} />
                <DateField label="HASTA" target="end" value={endInput} onChange={setEndInput} />
              </View>
            </View>
          )}

          {dateTarget && Platform.OS !== 'web' && (
            <DateTimePicker
              value={dateTarget === 'start' ? startDate : endDate}
              mode="date"
              maximumDate={new Date()}
              onChange={handleNativeDate}
            />
          )}

          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
            <Text className="text-slate-800 dark:text-white text-lg font-bold mb-4">
              {selectedTransaction ? 'Movimiento seleccionado' : 'Resumen'}
            </Text>
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <Text className="text-slate-500 mb-2">Movimientos: {reportTransactions.length}</Text>
                <Text className="text-emerald-500 font-bold mb-2">Ingresos: {formatCurrency(income)}</Text>
                <Text className="text-rose-500 font-bold">Gastos: {formatCurrency(expenses)}</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            className="bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2"
            onPress={handleExport}
            disabled={loading || isExporting}
          >
            {isExporting ? <ActivityIndicator color="white" /> : <Download size={20} color="white" />}
            <Text className="text-white font-bold">Generar CSV</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
