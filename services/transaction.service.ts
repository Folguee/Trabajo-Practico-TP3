import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Transaction, TransactionInput } from '../types';
import { firestoreDateToDate } from '../utils/date';
import { getParticipantShare } from '../utils/shared-expense';
import { auth, db } from './firebase';
import { deleteReceipt, resolveReceiptUrl } from './receipt.service';

export type { Transaction, TransactionInput } from '../types';

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay un usuario autenticado');
  return user;
};

const mapTransaction = async (
  id: string,
  raw: Record<string, unknown>,
  currentUserUid: string
): Promise<Transaction> => {
  let imageUrl: string | undefined;
  const imagePath =
    typeof raw.imagePath === 'string' ? raw.imagePath : undefined;

  if (imagePath) {
    try {
      imageUrl = await resolveReceiptUrl(imagePath, id);
    } catch (error) {
      console.warn(`No se pudo firmar el comprobante ${imagePath}:`, error);
    }
  }

  const transaction = {
    ...(raw as Omit<Transaction, 'id' | 'date' | 'imageUrl'>),
    id,
    date: firestoreDateToDate(raw.date),
    createdAt: raw.createdAt ? firestoreDateToDate(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? firestoreDateToDate(raw.updatedAt) : undefined,
    imageUrl,
  };

  if (transaction.type === 'shared') {
    transaction.amount = getParticipantShare(
      transaction.participants,
      currentUserUid
    );
  }

  return transaction;
};

export async function getTransactions(): Promise<Transaction[]> {
  const user = requireUser();
  const [personalSnapshot, sharedSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      )
    ),
    getDocs(
      query(
        collection(db, 'transactions'),
        where('participantUids', 'array-contains', user.uid),
        orderBy('date', 'desc')
      )
    ),
  ]);

  const documents = new Map<
    string,
    { id: string; data: Record<string, unknown> }
  >();
  [...personalSnapshot.docs, ...sharedSnapshot.docs].forEach((item) => {
    documents.set(item.id, {
      id: item.id,
      data: item.data() as Record<string, unknown>,
    });
  });

  const transactions = await Promise.all(
    [...documents.values()].map((item) =>
      mapTransaction(item.id, item.data, user.uid)
    )
  );

  return transactions.sort((left, right) => right.date.getTime() - left.date.getTime());
}

const validateSharedInput = (input: TransactionInput, userUid: string) => {
  if (input.type !== 'shared') return;

  if (
    input.creatorUid !== userUid ||
    !input.participantUids?.includes(userUid) ||
    !input.payerUid ||
    !input.participantUids.includes(input.payerUid) ||
    input.participants?.length !== input.participantUids.length ||
    !input.totalAmount ||
    !input.splitMode
  ) {
    throw new Error('Los datos del gasto compartido son invalidos');
  }

  const uniqueUids = new Set(input.participantUids);
  const participantUids = new Set(
    input.participants.map((participant) => participant.uid)
  );
  if (
    uniqueUids.size !== input.participantUids.length ||
    participantUids.size !== uniqueUids.size ||
    [...uniqueUids].some((uid) => !participantUids.has(uid))
  ) {
    throw new Error('Los participantes del gasto compartido son invalidos');
  }
};

export async function addTransaction(input: TransactionInput): Promise<string> {
  const user = requireUser();
  validateSharedInput(input, user.uid);

  const ref = await addDoc(collection(db, 'transactions'), {
    ...input,
    userId: user.uid,
    ...(input.type === 'shared' ? { creatorUid: user.uid } : {}),
    date: Timestamp.fromDate(input.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getTransactionById(
  id: string | number
): Promise<Transaction | null> {
  const user = requireUser();
  const snapshot = await getDoc(doc(db, 'transactions', String(id)));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  const canRead =
    data.userId === user.uid ||
    (Array.isArray(data.participantUids) &&
      data.participantUids.includes(user.uid));
  if (!canRead) return null;
  return mapTransaction(snapshot.id, data, user.uid);
}

export async function updateTransaction(
  id: string | number,
  input: Partial<TransactionInput>
): Promise<void> {
  const user = requireUser();
  const ref = doc(db, 'transactions', String(id));
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('La transaccion no existe');
  const existing = snapshot.data() as Transaction;
  const ownerUid = existing.creatorUid || existing.userId;
  if (ownerUid !== user.uid) {
    throw new Error('No tienes permiso para modificar esta transaccion');
  }
  if (input.creatorUid && input.creatorUid !== ownerUid) {
    throw new Error('No se puede cambiar el creador de la transaccion');
  }

  if (input.type === 'shared' || existing.type === 'shared') {
    validateSharedInput(
      {
        ...existing,
        ...input,
        creatorUid: ownerUid,
        date: input.date || firestoreDateToDate(existing.date),
      } as TransactionInput,
      user.uid
    );
  }

  await updateDoc(ref, {
    ...input,
    ...(input.date ? { date: Timestamp.fromDate(input.date) } : {}),
    userId: ownerUid,
    ...(input.type === 'shared' || existing.type === 'shared'
      ? { creatorUid: ownerUid }
      : {}),
    ...(existing.type === 'shared' && input.type && input.type !== 'shared'
      ? {
          creatorUid: deleteField(),
          participantUids: deleteField(),
          participants: deleteField(),
          payerUid: deleteField(),
          totalAmount: deleteField(),
          splitMode: deleteField(),
        }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(id: string | number): Promise<void> {
  const user = requireUser();
  const ref = doc(db, 'transactions', String(id).trim());
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('La transaccion no existe');

  const data = snapshot.data();
  if ((data.creatorUid || data.userId) !== user.uid) {
    throw new Error('No tienes permiso para eliminar esta transaccion');
  }

  await deleteDoc(ref);

  if (typeof data.imagePath === 'string' && data.imagePath) {
    try {
      await deleteReceipt(data.imagePath, snapshot.id);
    } catch (error) {
      console.warn('No se pudo eliminar el comprobante remoto:', error);
    }
  }
}
