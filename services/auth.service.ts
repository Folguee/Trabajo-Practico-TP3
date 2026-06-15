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
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, getNextNumericId } from './firebase';
import { ensureDefaultCategories } from './category.service';

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
  await ensureDefaultCategories(result.user.uid);

  return result.user;
}

// --- Login con Google ---
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Verificar si el usuario ya existe en Firestore
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uid', '==', user.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Si no existe, creamos su perfil con los datos de Google
    const nextId = await getNextNumericId('userIdCounter');
    await setDoc(doc(db, 'users', String(nextId)), {
      id: nextId,
      uid: user.uid,
      nombre: user.displayName || user.email?.split('@')[0] || 'Usuario Google',
      telefono: user.phoneNumber || '',
      email: user.email || '',
      createdAt: serverTimestamp(),
    });
    await ensureDefaultCategories(user.uid);
  }

  return user;
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

