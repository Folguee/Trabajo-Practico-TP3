export type CurrencySign = 'positive' | 'negative';

type FormatCurrencyOptions = {
  sign?: CurrencySign;
  showSign?: boolean;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export type MoneyValidationResult =
  | { valid: true; value: number }
  | { valid: false; error: string };

const ARS_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();

const getFormatter = (minimumFractionDigits: number, maximumFractionDigits: number) => {
  const key = `${minimumFractionDigits}-${maximumFractionDigits}`;
  let formatter = ARS_FORMATTER_CACHE.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits,
      maximumFractionDigits,
    });
    ARS_FORMATTER_CACHE.set(key, formatter);
  }

  return formatter;
};

const sanitizeMoneyValue = (value: string) =>
  value
    .trim()
    .replace(/\s/g, '')
    .replace(/\$/g, '')
    .replace(/[^\d.,]/g, '');

const getDecimalSeparatorIndex = (value: string) => {
  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    return Math.max(lastComma, lastDot);
  }

  if (lastComma >= 0) {
    return lastComma;
  }

  const separatorIndex = lastDot;
  if (separatorIndex < 0) return -1;

  const digitsAfterSeparator = value.length - separatorIndex - 1;
  const separatorCount = (value.match(/[.,]/g) || []).length;

  if (separatorCount > 1 && digitsAfterSeparator === 3) return -1;
  if (digitsAfterSeparator > 2) return -1;

  return separatorIndex;
};

const normalizeMoneyParts = (value: string) => {
  const sanitized = sanitizeMoneyValue(value);
  const decimalIndex = getDecimalSeparatorIndex(sanitized);
  const rawInteger = decimalIndex >= 0 ? sanitized.slice(0, decimalIndex) : sanitized;
  const rawDecimals = decimalIndex >= 0 ? sanitized.slice(decimalIndex + 1) : '';
  const integerDigits = rawInteger.replace(/\D/g, '');
  const decimalDigits = rawDecimals.replace(/\D/g, '');

  return {
    sanitized,
    decimalIndex,
    integerDigits,
    decimalDigits,
  };
};

export function formatCurrency(
  value: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    sign,
    showSign = Boolean(sign),
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  const formatted = getFormatter(minimumFractionDigits, maximumFractionDigits)
    .format(safeValue)
    .replace(/\u00a0/g, ' ');

  const resolvedSign = sign ?? (value < 0 ? 'negative' : undefined);
  if ((sign && !showSign) || !resolvedSign) return formatted;
  return `${resolvedSign === 'negative' ? '-' : '+'} ${formatted}`;
}

export function formatMoneyInput(value: string | number): string {
  const rawValue = typeof value === 'number' ? String(value) : value;
  const { sanitized, decimalIndex, integerDigits, decimalDigits } =
    normalizeMoneyParts(rawValue);

  if (!sanitized) return '';

  const normalizedInteger = (integerDigits || '0').replace(/^0+(?=\d)/, '');
  const groupedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalIndex < 0) return groupedInteger;
  return `${groupedInteger},${decimalDigits.slice(0, 2)}`;
}

export function parseMoneyInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || /[^\d\s$.,]/.test(trimmed)) return null;

  const { sanitized, decimalIndex, integerDigits, decimalDigits } =
    normalizeMoneyParts(trimmed);
  if (!sanitized || !integerDigits) return null;

  const separatorCount = (sanitized.match(/[.,]/g) || []).length;
  if (decimalIndex >= 0 && separatorCount > 1) {
    const integerPart = sanitized.slice(0, decimalIndex);
    const decimalSeparator = sanitized[decimalIndex];
    const otherSeparator = decimalSeparator === ',' ? '.' : ',';
    if (integerPart.includes(decimalSeparator) || sanitized.slice(decimalIndex + 1).includes(otherSeparator)) {
      return null;
    }
  }

  if (decimalDigits.length > 2) return null;
  const normalized = `${integerDigits}.${decimalDigits || '0'}`;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function validateMoneyInput(value: string): MoneyValidationResult {
  if (!value.trim()) {
    return { valid: false, error: 'Ingresa un monto.' };
  }

  if (/[^\d\s$.,]/.test(value)) {
    return { valid: false, error: 'Usa solo números y hasta dos decimales.' };
  }

  const parsed = parseMoneyInput(value);
  if (parsed === null) {
    return { valid: false, error: 'Ingresa un monto válido con hasta dos decimales.' };
  }

  if (parsed <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a cero.' };
  }

  return { valid: true, value: parsed };
}
