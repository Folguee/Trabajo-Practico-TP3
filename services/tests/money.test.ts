import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatMoneyInput,
  parseMoneyInput,
  validateMoneyInput,
} from '../../utils/money';

describe('money utils', () => {
  it('formatea importes como pesos argentinos', () => {
    expect(formatCurrency(1234.56)).toBe('$ 1.234,56');
    expect(formatCurrency(-1234.56)).toBe('- $ 1.234,56');
    expect(formatCurrency(1234.56, { sign: 'positive' })).toBe('+ $ 1.234,56');
    expect(formatCurrency(1234.56, { sign: 'negative' })).toBe('- $ 1.234,56');
  });

  it.each([
    ['1000', 1000],
    ['1000,5', 1000.5],
    ['1.000,50', 1000.5],
    ['1000.50', 1000.5],
    ['$ 1.234,56', 1234.56],
  ])('parsea %s como %s', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected);
  });

  it('formatea el valor mientras se escribe', () => {
    expect(formatMoneyInput('1000')).toBe('1.000');
    expect(formatMoneyInput('1000,5')).toBe('1.000,5');
    expect(formatMoneyInput('1000.50')).toBe('1.000,50');
    expect(formatMoneyInput('$ 1234567,89')).toBe('1.234.567,89');
  });

  it.each(['', '0', '-10', 'abc', '1,2,3', '10,999'])(
    'rechaza el valor inválido %s',
    (input) => {
      expect(validateMoneyInput(input).valid).toBe(false);
    }
  );
});
