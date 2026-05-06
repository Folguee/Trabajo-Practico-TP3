/** 
BACKEND - Configuración de Firebase
Este archivo solo lo importan los servicios (ej: auth.service.ts).
El FRONTEND nunca importa este archivo directamente.
*/

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAXQngNZX1gjb_03pWCsSsyFEubrdasVZk",
  authDomain: "tp3---gestor-de-gastos.firebaseapp.com",
  projectId: "tp3---gestor-de-gastos",
  storageBucket: "tp3---gestor-de-gastos.firebasestorage.app",
  messagingSenderId: "52896218835",
  appId: "1:52896218835:web:4cc762c026209cf82d9e26"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
