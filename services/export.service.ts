import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Transaction } from '../types';
import { formatIsoDate } from '../utils/date';

export type ExportResult = 'downloaded' | 'shared';

export const buildCSV = (transactions: Transaction[]) => {
  const headers = ['Fecha', 'Tipo', 'Categoria', 'Titulo', 'Monto', 'Nota'];
  const rows = transactions.map((transaction) => [
    formatIsoDate(transaction.date),
    transaction.type === 'income' ? 'Ingreso' : 'Gasto',
    transaction.categoryName,
    transaction.title,
    Number(transaction.amount).toFixed(2),
    transaction.note || '',
  ]);

  return [
    headers.join(','),
    ...rows.map((row) =>
      row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
};

export async function generateAndDownloadCSV(
  transactions: Transaction[],
  fileName = 'movimientos.csv'
): Promise<ExportResult> {
  if (!transactions.length) {
    throw new Error('No hay transacciones para exportar');
  }

  const csvContent = buildCSV(transactions);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('El dispositivo no permite compartir archivos');
  }

  const baseDir =
    (FileSystem as typeof FileSystem & {
      cacheDirectory?: string;
      documentDirectory?: string;
    }).cacheDirectory ||
    (FileSystem as typeof FileSystem & { documentDirectory?: string })
      .documentDirectory;
  if (!baseDir) throw new Error('No se encontro un directorio temporal');

  const fileUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: 'utf8',
  });
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exportar movimientos',
  });
  return 'shared';
}
