/**
 * Script para limpiar las transacciones "basura" de un usuario y generar
 * un set de transacciones con titulos, montos y categorias mas realistas.
 *
 * Uso:
 *   1. Modo solo lectura (lista lo que hay, sin tocar nada):
 *        WENDY_PASSWORD='la-password' node scripts/rewrite-transactions.mjs
 *
 *   2. Modo escritura (BORRA las transacciones existentes y crea nuevas):
 *        WENDY_PASSWORD='la-password' node scripts/rewrite-transactions.mjs --apply
 *
 *   3. Solo reescribir (no borra; renombra/recategoriza las existentes):
 *        WENDY_PASSWORD='la-password' node scripts/rewrite-transactions.mjs --apply --rewrite
 *
 * Variables de entorno:
 *   - Las EXPO_PUBLIC_FIREBASE_* se leen del archivo .env del proyecto.
 *   - TARGET_EMAIL    (opcional) email del usuario. Default: wendymarcos2@gmail.com
 *   - TARGET_PASSWORD / WENDY_PASSWORD  password del usuario (requerido).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    console.warn('No se pudo leer .env:', error.message);
  }
}

loadEnv();

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'wendymarcos2@gmail.com';
const TARGET_PASSWORD =
  process.env.TARGET_PASSWORD || process.env.WENDY_PASSWORD || '';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const REWRITE_ONLY = args.includes('--rewrite');
const DRY_RUN = !APPLY;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const EXPENSE_TEMPLATES = [
  { category: 'Alimentacion', title: 'Supermercado Coto', min: 25000, max: 70000 },
  { category: 'Alimentacion', title: 'Compra semanal Carrefour', min: 30000, max: 85000 },
  { category: 'Alimentacion', title: 'Verduleria del barrio', min: 4000, max: 12000 },
  { category: 'Alimentacion', title: 'Carniceria La Estrella', min: 8000, max: 25000 },
  { category: 'Alimentacion', title: 'Panaderia', min: 2500, max: 7000 },
  { category: 'Transporte', title: 'Carga SUBE', min: 3000, max: 8000 },
  { category: 'Transporte', title: 'Nafta YPF', min: 20000, max: 45000 },
  { category: 'Transporte', title: 'Viaje en Uber', min: 2500, max: 9000 },
  { category: 'Transporte', title: 'Peaje autopista', min: 1200, max: 3500 },
  { category: 'Hogar', title: 'Alquiler departamento', min: 250000, max: 420000 },
  { category: 'Hogar', title: 'Expensas', min: 40000, max: 90000 },
  { category: 'Hogar', title: 'Articulos de limpieza', min: 8000, max: 22000 },
  { category: 'Hogar', title: 'Ferreteria', min: 5000, max: 30000 },
  { category: 'Servicios', title: 'Factura de luz Edesur', min: 15000, max: 45000 },
  { category: 'Servicios', title: 'Internet Fibertel', min: 18000, max: 30000 },
  { category: 'Servicios', title: 'Plan celular Movistar', min: 9000, max: 18000 },
  { category: 'Servicios', title: 'Netflix', min: 6000, max: 9000 },
  { category: 'Servicios', title: 'Spotify Premium', min: 3000, max: 5000 },
  { category: 'Servicios', title: 'Gas Metrogas', min: 12000, max: 35000 },
  { category: 'Salud', title: 'Farmacia', min: 6000, max: 28000 },
  { category: 'Salud', title: 'Consulta medica', min: 15000, max: 40000 },
  { category: 'Salud', title: 'Estudios de laboratorio', min: 20000, max: 60000 },
  { category: 'Ocio', title: 'Cine', min: 6000, max: 14000 },
  { category: 'Ocio', title: 'Cena en restaurante', min: 18000, max: 55000 },
  { category: 'Ocio', title: 'Cafe con amigas', min: 4000, max: 12000 },
  { category: 'Ocio', title: 'Heladeria', min: 3000, max: 9000 },
];

const INCOME_TEMPLATES = [
  { category: 'Ingresos', title: 'Sueldo', min: 650000, max: 950000 },
  { category: 'Ingresos', title: 'Pago freelance', min: 80000, max: 250000 },
  { category: 'Ingresos', title: 'Reintegro', min: 5000, max: 25000 },
  { category: 'Ingresos', title: 'Transferencia recibida', min: 20000, max: 120000 },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomRecentDate(monthsBack = 4) {
  const now = new Date();
  const start = new Date();
  start.setMonth(now.getMonth() - monthsBack);
  const ts = randInt(start.getTime(), now.getTime());
  return new Date(ts);
}

function randomThisMonthDate() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  // Hasta hoy (no fechas futuras dentro del mes)
  const ts = randInt(start, now.getTime());
  return new Date(ts);
}

function makeTx(tpl, type, categoriesByName, date) {
  const category = categoriesByName[tpl.category];
  const amount = roundTo(randInt(tpl.min, tpl.max), 100);
  return {
    type,
    amount,
    title: tpl.title,
    date,
    categoryId: category.id,
    categoryName: category.name,
  };
}

function buildNewTransactions(categoriesByName, count) {
  const result = [];

  for (let m = 0; m < 4; m += 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);
    date.setDate(1);
    const tpl = INCOME_TEMPLATES[0];
    if (categoriesByName[tpl.category]) {
      result.push(makeTx(tpl, 'income', categoriesByName, date));
    }
  }

  for (let i = 0; i < 2; i += 1) {
    const tpl = pick(INCOME_TEMPLATES.slice(1));
    if (categoriesByName[tpl.category]) {
      result.push(makeTx(tpl, 'income', categoriesByName, randomRecentDate()));
    }
  }

  const expenseCount = Math.max(0, count - result.length);
  for (let i = 0; i < expenseCount; i += 1) {
    const tpl = pick(EXPENSE_TEMPLATES);
    if (!categoriesByName[tpl.category]) continue;
    result.push(makeTx(tpl, 'expense', categoriesByName, randomRecentDate()));
  }

  result.sort((a, b) => b.date.getTime() - a.date.getTime());
  return result;
}

function buildThisMonthTransactions(categoriesByName) {
  const result = [];

  // Un ingreso (sueldo) con fecha del 1 de este mes.
  const incomeTpl = INCOME_TEMPLATES[0];
  if (categoriesByName[incomeTpl.category]) {
    const date = new Date();
    date.setDate(1);
    result.push(makeTx(incomeTpl, 'income', categoriesByName, date));
  }

  // Al menos un gasto por cada categoria de gasto disponible este mes.
  const expenseCategories = [
    ...new Set(EXPENSE_TEMPLATES.map((t) => t.category)),
  ];

  for (const categoryName of expenseCategories) {
    if (!categoriesByName[categoryName]) continue;
    const pool = EXPENSE_TEMPLATES.filter((t) => t.category === categoryName);
    const tpl = pick(pool);
    result.push(makeTx(tpl, 'expense', categoriesByName, randomThisMonthDate()));
  }

  // Unos cuantos gastos extra variados para dar volumen al mes.
  for (let i = 0; i < 6; i += 1) {
    const tpl = pick(EXPENSE_TEMPLATES);
    if (!categoriesByName[tpl.category]) continue;
    result.push(makeTx(tpl, 'expense', categoriesByName, randomThisMonthDate()));
  }

  result.sort((a, b) => b.date.getTime() - a.date.getTime());
  return result;
}

function buildSharedTransactions(categoriesByName, currentUser, publicUsers) {
  const category =
    categoriesByName.Alimentacion ||
    categoriesByName.Ocio ||
    categoriesByName.Hogar ||
    categoriesByName.Servicios;

  const friend = publicUsers.find((user) => user.uid !== currentUser.uid);
  if (!category || !friend) return [];

  const templates = [
    { title: 'Cena compartida', totalAmount: 42000 },
    { title: 'Supermercado compartido', totalAmount: 58000 },
  ];

  return templates.map((tpl) => {
    const totalAmount = roundTo(tpl.totalAmount, 100);
    const myAmount = roundTo(totalAmount / 2, 100);
    const friendAmount = totalAmount - myAmount;

    return {
      type: 'shared',
      title: tpl.title,
      date: randomRecentDate(3),
      categoryId: category.id,
      categoryName: category.name,
      userId: currentUser.uid,
      creatorUid: currentUser.uid,
      participantUids: [currentUser.uid, friend.uid],
      participants: [
        {
          uid: currentUser.uid,
          nombre: currentUser.nombre,
          amount: myAmount,
          percentage: 50,
        },
        {
          uid: friend.uid,
          nombre: friend.nombre,
          amount: friendAmount,
          percentage: 50,
        },
      ],
      payerUid: currentUser.uid,
      totalAmount,
      splitMode: 'equal',
    };
  });
}

async function main() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Faltan las variables EXPO_PUBLIC_FIREBASE_* en el .env');
  }
  if (!TARGET_PASSWORD) {
    throw new Error(
      'Necesitas la password del usuario. Ejecuta:\n' +
        '  WENDY_PASSWORD="..." node scripts/rewrite-transactions.mjs' +
        (APPLY ? ' --apply' : '')
    );
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`Autenticando como ${TARGET_EMAIL}...`);
  const credential = await signInWithEmailAndPassword(
    auth,
    TARGET_EMAIL,
    TARGET_PASSWORD
  );
  const uid = credential.user.uid;
  const currentUser = {
    uid,
    nombre:
      credential.user.displayName ||
      credential.user.email?.split('@')[0] ||
      'Yo',
  };
  console.log(`OK. uid = ${uid}\n`);

  const catSnap = await getDocs(
    query(collection(db, 'categories'), where('userId', '==', uid))
  );
  const categoriesByName = {};
  catSnap.forEach((d) => {
    const data = d.data();
    categoriesByName[data.name] = { id: d.id, ...data };
  });

  if (Object.keys(categoriesByName).length === 0) {
    throw new Error(
      'El usuario no tiene categorias. Abri la app con esta cuenta una vez para que se creen las categorias por defecto.'
    );
  }

  const publicUsersSnap = await getDocs(collection(db, 'publicUsers'));
  const publicUsers = publicUsersSnap.docs.map((d) => {
    const data = d.data();
    return {
      uid: typeof data.uid === 'string' ? data.uid : d.id,
      nombre:
        typeof data.nombre === 'string' && data.nombre.trim()
          ? data.nombre.trim()
          : 'Usuario',
    };
  });

  console.log('Categorias disponibles:');
  Object.values(categoriesByName).forEach((c) =>
    console.log(`  - ${c.name} (${c.type})`)
  );
  console.log('');

  const txSnap = await getDocs(
    query(collection(db, 'transactions'), where('userId', '==', uid))
  );
  const transactions = [];
  txSnap.forEach((d) => transactions.push({ id: d.id, ...d.data() }));

  const personal = transactions.filter((t) => t.type !== 'shared');
  const shared = transactions.filter((t) => t.type === 'shared');

  console.log(
    `Transacciones actuales: ${transactions.length} ` +
      `(${personal.length} personales, ${shared.length} compartidas)\n`
  );
  console.log('--- Listado actual ---');
  transactions.forEach((t) => {
    const tag =
      t.type === 'shared' ? '[shared]' : t.type === 'income' ? '[+]' : '[-]';
    console.log(`  ${tag} ${t.id} | $${t.amount} | "${t.title}" (${t.categoryName || 's/cat'})`);
  });
  console.log('');

  if (REWRITE_ONLY) {
    let i = 0;
    for (const tx of personal) {
      const pool = tx.type === 'income' ? INCOME_TEMPLATES : EXPENSE_TEMPLATES;
      const valid = pool.filter((t) => categoriesByName[t.category]);
      const tpl = valid[i % valid.length];
      i += 1;
      const category = categoriesByName[tpl.category];
      console.log(
        `RENOMBRAR ${tx.id}: "${tx.title}" -> "${tpl.title}" (${tpl.category})`
      );
      if (APPLY) {
        await updateDoc(doc(db, 'transactions', tx.id), {
          title: tpl.title,
          categoryId: category.id,
          categoryName: category.name,
          updatedAt: serverTimestamp(),
        });
      }
    }
    finishLog(APPLY, 'rewrite');
    await signOut(auth);
    return;
  }

  const newTxs = buildNewTransactions(categoriesByName, Math.max(personal.length, 18));
  const thisMonthTxs = buildThisMonthTransactions(categoriesByName);
  const newSharedTxs = buildSharedTransactions(categoriesByName, currentUser, publicUsers);

  console.log(`--- Se BORRARAN ${personal.length} transacciones personales ---`);
  console.log(`--- Se CREARAN ${newTxs.length} transacciones nuevas: ---`);
  newTxs.forEach((t) => {
    const tag = t.type === 'income' ? '[+]' : '[-]';
    console.log(
      `  ${tag} $${t.amount} | "${t.title}" (${t.categoryName}) | ${t.date.toLocaleDateString('es-AR')}`
    );
  });

  console.log(`--- Se CREARAN ${thisMonthTxs.length} transacciones de ESTE MES (todas las categorias): ---`);
  thisMonthTxs.forEach((t) => {
    const tag = t.type === 'income' ? '[+]' : '[-]';
    console.log(
      `  ${tag} $${t.amount} | "${t.title}" (${t.categoryName}) | ${t.date.toLocaleDateString('es-AR')}`
    );
  });

  if (newSharedTxs.length > 0) {
    console.log(`--- Se CREARAN ${newSharedTxs.length} gastos compartidos: ---`);
    newSharedTxs.forEach((t) => {
      console.log(
        `  [shared] $${t.totalAmount} | "${t.title}" (${t.categoryName}) | ${t.date.toLocaleDateString('es-AR')}`
      );
    });
  } else {
    console.log('--- No se crearán gastos compartidos (no se encontró otro usuario en publicUsers) ---');
  }
  console.log('');

  if (DRY_RUN) {
    finishLog(false, 'delete-and-seed');
    await signOut(auth);
    return;
  }

  for (const tx of personal) {
    await deleteDoc(doc(db, 'transactions', tx.id));
    console.log(`Borrada ${tx.id}`);
  }

  for (const tx of [...newTxs, ...thisMonthTxs]) {
    await addDoc(collection(db, 'transactions'), {
      type: tx.type,
      amount: tx.amount,
      title: tx.title,
      categoryId: tx.categoryId,
      categoryName: tx.categoryName,
      date: Timestamp.fromDate(tx.date),
      userId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Creada "${tx.title}" ($${tx.amount})`);
  }

  for (const tx of newSharedTxs) {
    await addDoc(collection(db, 'transactions'), {
      type: tx.type,
      amount: tx.participants[0].amount,
      title: tx.title,
      categoryId: tx.categoryId,
      categoryName: tx.categoryName,
      date: Timestamp.fromDate(tx.date),
      userId: tx.userId,
      creatorUid: tx.creatorUid,
      participantUids: tx.participantUids,
      participants: tx.participants,
      payerUid: tx.payerUid,
      totalAmount: tx.totalAmount,
      splitMode: tx.splitMode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Creada compartida "${tx.title}" ($${tx.totalAmount})`);
  }

  finishLog(true, 'delete-and-seed');
  await signOut(auth);
}

function finishLog(applied, mode) {
  console.log('\n----------------------------------------');
  if (!applied) {
    console.log(`DRY-RUN (${mode}): no se modifico nada.`);
    console.log('Para aplicar, agrega --apply al comando.');
  } else {
    console.log(`Listo (${mode}). Cambios aplicados.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nError:', error.message || error);
    process.exit(1);
  });