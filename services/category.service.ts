import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../constants/transactions';
import type { Category } from '../types';
import { auth, db } from './firebase';

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay un usuario autenticado');
  return user;
};

export async function ensureDefaultCategories(userId?: string): Promise<void> {
  const uid = userId || requireUser().uid;
  const existing = await getDocs(
    query(collection(db, 'categories'), where('userId', '==', uid))
  );
  if (!existing.empty) return;

  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((category) => {
    const ref = doc(collection(db, 'categories'));
    batch.set(ref, { ...category, userId: uid });
  });
  await batch.commit();
}

export async function getCategories(): Promise<Category[]> {
  const user = requireUser();
  await ensureDefaultCategories(user.uid);
  const snapshot = await getDocs(
    query(collection(db, 'categories'), where('userId', '==', user.uid))
  );

  return snapshot.docs
    .map((categoryDoc) => ({
      id: categoryDoc.id,
      ...(categoryDoc.data() as Omit<Category, 'id'>),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
