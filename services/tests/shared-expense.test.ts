import { describe, expect, it } from 'vitest';
import type { PublicUser } from '../../types';
import {
  calculateSharedParticipants,
  validateAndCalculateSharedParticipants,
} from '../../utils/shared-expense';

const users: PublicUser[] = [
  { uid: 'creator', nombre: 'Creador', nombreLower: 'creador' },
  { uid: 'friend-1', nombre: 'Ana', nombreLower: 'ana' },
  { uid: 'friend-2', nombre: 'Bruno', nombreLower: 'bruno' },
];

describe('shared expense split', () => {
  it('reparte centavos sobrantes en orden, comenzando por el creador', () => {
    const result = calculateSharedParticipants(10, users, 'equal');
    expect(result.map((item) => item.amount)).toEqual([3.34, 3.33, 3.33]);
  });

  it('acepta montos manuales que coinciden con el total', () => {
    const result = calculateSharedParticipants(100, users, 'amount', [
      { uid: 'creator', value: 20 },
      { uid: 'friend-1', value: 30 },
      { uid: 'friend-2', value: 50 },
    ]);
    expect(result.map((item) => item.amount)).toEqual([20, 30, 50]);
  });

  it('rechaza montos manuales cuya suma no coincide', () => {
    expect(() =>
      calculateSharedParticipants(100, users, 'amount', [
        { uid: 'creator', value: 20 },
        { uid: 'friend-1', value: 20 },
        { uid: 'friend-2', value: 20 },
      ])
    ).toThrow('debe coincidir');
  });

  it('calcula porcentajes y conserva exactamente el total monetario', () => {
    const result = calculateSharedParticipants(10, users, 'percentage', [
      { uid: 'creator', value: 33.33 },
      { uid: 'friend-1', value: 33.33 },
      { uid: 'friend-2', value: 33.34 },
    ]);
    expect(result.reduce((sum, item) => sum + item.amount, 0)).toBe(10);
    expect(result.map((item) => item.amount)).toEqual([3.34, 3.33, 3.33]);
  });

  it('rechaza porcentajes que no suman 100 y usuarios repetidos', () => {
    expect(() =>
      calculateSharedParticipants(100, users, 'percentage', [
        { uid: 'creator', value: 40 },
        { uid: 'friend-1', value: 40 },
        { uid: 'friend-2', value: 10 },
      ])
    ).toThrow('100%');

    expect(() =>
      calculateSharedParticipants(100, [users[0], users[0]], 'equal')
    ).toThrow('repetidos');

    expect(() =>
      calculateSharedParticipants(100, users, 'percentage', [
        { uid: 'creator', value: Number.NaN },
        { uid: 'friend-1', value: 50 },
        { uid: 'friend-2', value: 50 },
      ])
    ).toThrow('100%');
  });

  it('valida pagador y campos manuales antes de calcular el reparto', () => {
    expect(() =>
      validateAndCalculateSharedParticipants(
        100,
        users,
        '',
        'equal',
        {}
      )
    ).toThrow('quién pagó');

    expect(() =>
      validateAndCalculateSharedParticipants(
        100,
        users,
        'creator',
        'amount',
        {
          creator: '50',
          'friend-1': '',
          'friend-2': '50',
        }
      )
    ).toThrow('Completa el monto de Ana');
  });

  it('rechaza valores manuales no numéricos o iguales a cero', () => {
    expect(() =>
      validateAndCalculateSharedParticipants(
        100,
        users,
        'creator',
        'percentage',
        {
          creator: '50',
          'friend-1': 'texto',
          'friend-2': '50',
        }
      )
    ).toThrow('porcentaje mayor a cero para Ana');

    expect(() =>
      validateAndCalculateSharedParticipants(
        100,
        users,
        'creator',
        'amount',
        {
          creator: '50',
          'friend-1': '0',
          'friend-2': '50',
        }
      )
    ).toThrow('monto mayor a cero para Ana');
  });
});
