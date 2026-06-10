/** 
BACKEND - Servicio de Autenticación
Este archivo encapsula toda la lógica de Firebase Auth.
El FRONTEND nunca importa Firebase directamente, llama a estas funciones.
*/

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, getNextNumericId } from './firebase';

// --- Login con email y contraseña ---
export async function login(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// --- Registro de nuevo usuario ---
export async function register(
  name: string,
  email: string,
  password: string,
  phone: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });

  const nextId = await getNextNumericId('userIdCounter');

  await setDoc(doc(db, 'users', String(nextId)), {
    id: nextId,
    uid: result.user.uid,
    nombre: name,
    telefono: phone,
    email,
    createdAt: serverTimestamp(),
  });

  return result.user;
}

// --- Cerrar sesión ---
export async function logout(): Promise<void> {
  await signOut(auth);
}

// --- Escuchar cambios de autenticación (estado de sesión) ---
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
