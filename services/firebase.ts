/** 
BACKEND - Configuración de Firebase
Este archivo solo lo importan los servicios (ej: auth.service.ts).
El FRONTEND nunca importa este archivo directamente.
*/

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export type CounterName = 'userIdCounter' | 'transactionIdCounter';

export async function getNextNumericId(counterName: CounterName): Promise<number> {
  return await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'counters', counterName);
    const snapshot = await transaction.get(counterRef);

    const current = snapshot.exists() ? Number(snapshot.data()?.value ?? 0) : 0;
    const next = current + 1;

    transaction.set(
      counterRef,
      {
        value: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return next;
  });
}
