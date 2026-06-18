/** 
BACKEND - Configuración de Firebase
Este archivo solo lo importan los servicios (ej: auth.service.ts).
El FRONTEND nunca importa este archivo directamente.
*/

import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// `getReactNativePersistence` existe en runtime en la build de React Native de
// Firebase, pero no está tipado en el entry web de `firebase/auth` (v12).
// Lo importamos vía require para evitar el error de tipos.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: unknown) => Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// En web usamos getAuth (persistencia del navegador). En mobile (iOS/Android)
// usamos initializeAuth con AsyncStorage para persistir la sesión y para que
// el listener de auth arranque de forma confiable.
function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // initializeAuth lanza si ya fue inicializado (p. ej. tras un Fast Refresh)
    // o si la persistencia con AsyncStorage no está disponible. En ese caso
    // caemos a getAuth para no romper el arranque de la app.
    console.warn('initializeAuth falló, usando getAuth como fallback:', error);
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
