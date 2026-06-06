// services/export.service.ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Transaction } from "./transaction.service";

export const generateAndDownloadCSV = async (
  transactions: Transaction[],
  fileName = 'movimientos.csv'
): Promise<void> => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No hay transacciones para exportar');
  }

  // Función segura para obtener fecha como string YYYY-MM-DD
  const getSafeDateString = (dateField: any): string => {
    if (!dateField) return '';

    try {
      let dateStr = String(dateField).trim();

      // Manejar formato "SUBE 15/11/2004" o similar
      if (dateStr.includes('/')) {
        const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateField);

      return date.toISOString().split('T')[0];
    } catch {
      return String(dateField);
    }
  };

  // Generar CSV
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Título', 'Monto', 'Nota'];

  const rows = transactions.map(t => [
    getSafeDateString(t.date),
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    t.category || '',
    t.title || '',
    Number(t.amount || 0).toFixed(2),
    t.note || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  // === WEB: Descarga directa ===
  if (typeof window !== 'undefined' && window.navigator) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return;
  }

  // === MÓVIL: Guardar y compartir ===
  // Some versions/types of expo-file-system may not expose `cacheDirectory` in typings.
  // Fall back to documentDirectory or use a typed-any access to avoid TS errors.
  const baseDir: string = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
  const fileUri = baseDir + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: 'utf8',
  });

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar movimientos',
    });
  }
};