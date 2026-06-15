import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { PublicUser } from '../types';
import { auth, db } from './firebase';

export async function syncPublicUser(
  uid: string,
  nombre: string
): Promise<void> {
  const normalizedName = nombre.trim() || 'Usuario';
  await setDoc(
    doc(db, 'publicUsers', uid),
    {
      uid,
      nombre: normalizedName,
      nombreLower: normalizedName.toLocaleLowerCase('es'),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getPublicUsers(): Promise<PublicUser[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No hay un usuario autenticado');

  const snapshot = await getDocs(
    query(collection(db, 'publicUsers'), orderBy('nombreLower', 'asc'))
  );

  return snapshot.docs
    .map((item) => item.data() as PublicUser)
    .filter((user) => user.uid !== currentUser.uid);
}
