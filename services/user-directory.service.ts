import {
  collection,
  doc,
  getDocs,
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

  const snapshot = await getDocs(collection(db, 'publicUsers'));

  return snapshot.docs
    .map((item) => {
      const data = item.data();
      const nombre =
        typeof data.nombre === 'string' && data.nombre.trim()
          ? data.nombre.trim()
          : 'Usuario';
      return {
        uid: typeof data.uid === 'string' ? data.uid : item.id,
        nombre,
        nombreLower:
          typeof data.nombreLower === 'string'
            ? data.nombreLower
            : nombre.toLocaleLowerCase('es'),
      };
    })
    .filter((user) => user.uid !== currentUser.uid)
    .sort((left, right) =>
      left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' })
    );
}
