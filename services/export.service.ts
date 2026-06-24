import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Transaction } from '../types';
import { formatIsoDate } from '../utils/date';

export type ExportResult = 'downloaded' | 'shared';

const CSV_MIME_TYPE = 'text/csv';
const CSV_UTI = 'public.comma-separated-values-text';

const sanitizeFileName = (fileName: string) => {
  const normalized = fileName.trim() || 'movimientos.csv';
  const safeName = normalized.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');
  return safeName.toLowerCase().endsWith('.csv') ? safeName : `${safeName}.csv`;
};

const getExportDirectory = () => {
  const fs = FileSystem as typeof FileSystem & {
    Paths?: {
      cache?: { uri?: string };
      document?: { uri?: string };
    };
  };

  const cacheUri = fs.Paths?.cache?.uri;
  const documentUri = fs.Paths?.document?.uri;
  const legacyCacheUri = (FileSystem as typeof FileSystem & { cacheDirectory?: string })
    .cacheDirectory;
  const legacyDocumentUri = (
    FileSystem as typeof FileSystem & { documentDirectory?: string }
  ).documentDirectory;

  return cacheUri || documentUri || legacyCacheUri || legacyDocumentUri || null;
};

export const buildCSV = (transactions: Transaction[]) => {
  const headers = ['Fecha', 'Tipo', 'Categoria', 'Titulo', 'Monto', 'Nota'];
  const rows = transactions.map((transaction) => [
    formatIsoDate(transaction.date),
    transaction.type === 'income'
      ? 'Ingreso'
      : transaction.type === 'shared'
        ? 'Compartido'
        : 'Gasto',
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

  const csvContent = `\uFEFF${buildCSV(transactions)}`;

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

  const baseDir = getExportDirectory();
  if (!baseDir) throw new Error('No se encontro un directorio temporal');

  const safeFileName = sanitizeFileName(fileName);
  const fileUri = `${baseDir}${safeFileName}`;

  if ('File' in FileSystem && FileSystem.Paths?.cache) {
    const targetDirectory =
      baseDir === FileSystem.Paths.document?.uri
        ? FileSystem.Paths.document
        : FileSystem.Paths.cache;
    const file = new FileSystem.File(targetDirectory, safeFileName);
    file.write(csvContent);
  } else {
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: 'utf8',
    });
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: CSV_MIME_TYPE,
    UTI: CSV_UTI,
    dialogTitle: 'Exportar movimientos',
  });
  return 'shared';
}
