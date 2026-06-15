import type {
  PublicUser,
  SharedParticipant,
  SharedSplitMode,
} from '../types';

type SplitValue = { uid: string; value?: number };

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => value / 100;

const validateUsers = (users: PublicUser[]) => {
  if (users.length < 2) {
    throw new Error('Selecciona al menos dos participantes');
  }

  const uniqueUids = new Set(users.map((user) => user.uid));
  if (uniqueUids.size !== users.length) {
    throw new Error('No puede haber participantes repetidos');
  }
};

export function calculateSharedParticipants(
  total: number,
  users: PublicUser[],
  mode: SharedSplitMode,
  values: SplitValue[] = []
): SharedParticipant[] {
  validateUsers(users);
  const totalCents = toCents(total);
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    throw new Error('El monto total debe ser mayor a cero');
  }

  const valueByUid = new Map(values.map((item) => [item.uid, item.value ?? 0]));
  let amountsInCents: number[];

  if (mode === 'equal') {
    const base = Math.floor(totalCents / users.length);
    const remainder = totalCents - base * users.length;
    amountsInCents = users.map((_, index) => base + (index < remainder ? 1 : 0));
  } else if (mode === 'amount') {
    amountsInCents = users.map((user) =>
      toCents(Number(valueByUid.get(user.uid) ?? 0))
    );
    if (amountsInCents.some((amount) => !Number.isFinite(amount) || amount < 0)) {
      throw new Error('Los montos no pueden ser negativos');
    }
    if (amountsInCents.reduce((sum, amount) => sum + amount, 0) !== totalCents) {
      throw new Error('La suma de las partes debe coincidir con el total');
    }
  } else {
    const percentages = users.map((user) =>
      Number(valueByUid.get(user.uid) ?? 0)
    );
    const percentageTotal = percentages.reduce(
      (sum, percentage) => sum + percentage,
      0
    );
    if (
      percentages.some(
        (percentage) => !Number.isFinite(percentage) || percentage < 0
      ) ||
      Math.abs(percentageTotal - 100) > 0.0001
    ) {
      throw new Error('Los porcentajes deben sumar 100%');
    }

    amountsInCents = percentages.map((percentage) =>
      Math.floor((totalCents * percentage) / 100)
    );
    let remainder =
      totalCents - amountsInCents.reduce((sum, amount) => sum + amount, 0);
    for (let index = 0; remainder > 0; index = (index + 1) % users.length) {
      amountsInCents[index] += 1;
      remainder -= 1;
    }
  }

  return users.map((user, index) => ({
    uid: user.uid,
    nombre: user.nombre,
    amount: fromCents(amountsInCents[index]),
    percentage:
      mode === 'percentage'
        ? Number(valueByUid.get(user.uid) ?? 0)
        : Number(((amountsInCents[index] / totalCents) * 100).toFixed(4)),
  }));
}

export const getParticipantShare = (
  participants: SharedParticipant[] | undefined,
  uid: string
) => participants?.find((participant) => participant.uid === uid)?.amount ?? 0;
