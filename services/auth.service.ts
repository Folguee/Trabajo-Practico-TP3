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
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ensureDefaultCategories } from './category.service';
import { syncPublicUser } from './user-directory.service';

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

  // El documento se indexa por uid: es único por usuario y evita duplicados.
  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    nombre: name,
    telefono: phone,
    email,
    createdAt: serverTimestamp(),
  });
  await syncPublicUser(result.user.uid, name);
  await ensureDefaultCategories(result.user.uid);

  return result.user;
}

// --- Login con Google ---
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Verificar si el usuario ya existe en Firestore (lookup directo por uid)
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    // Si no existe, creamos su perfil con los datos de Google
    await setDoc(userRef, {
      uid: user.uid,
      nombre: user.displayName || user.email?.split('@')[0] || 'Usuario Google',
      telefono: user.phoneNumber || '',
      email: user.email || '',
      createdAt: serverTimestamp(),
    });
    await ensureDefaultCategories(user.uid);
  }
  await syncPublicUser(
    user.uid,
    user.displayName || user.email?.split('@')[0] || 'Usuario Google'
  );

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
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await syncPublicUser(
          user.uid,
          user.displayName || user.email?.split('@')[0] || 'Usuario'
        );
      } catch (error) {
        console.warn('No se pudo sincronizar el directorio publico:', error);
      }
    }
    callback(user);
  });
}
