# Documentación del Proyecto: Control de Gastos "Mis Finanzas"

> Aplicación desarrollada con **Expo (React Native)**, **Firebase**, **Expo Router**, **NativeWind**, **Zustand** y **TanStack Query**.

---

## Índice de navegación (flujo de la app)

```
INDEX (app/index.tsx)          ← Pantalla de inicio / landing
  ├─ [Iniciar Sesión] ──> LOGIN (app/login.tsx)
  ├─ [Registrarme] ────> REGISTER (app/register.tsx)
  └─ [X] ──────────────> Cierra la app

LOGIN / REGISTER ──> DASHBOARD (app/(tabs)/dashboard.tsx)
                        │
               ┌────────┴──────────────────────────┐
               │  app/(tabs)/_layout.tsx            │
               │  Renderiza SidebarLayout UNA vez   │
               │  alrededor de <Slot/> → el nav     │
               │  (sidebar/BottomNav) queda FIJO    │
               ├─ Dashboard      (app/(tabs)/dashboard.tsx)
               ├─ Transacciones  (app/(tabs)/transacciones.tsx)
               ├─ Stats          (app/(tabs)/stats.tsx)
               ├─ Exportar       (app/(tabs)/exportar.tsx)
               └─ Perfil + Cerrar Sesión (app/(tabs)/perfil.tsx)

DASHBOARD ──> Transaction Form (app/transaction-form.tsx)
           ──> Transaction Detail (app/transaction-detail.tsx)
           ──> Exportar (app/(tabs)/exportar.tsx)
TRANSACCIONES ──> Transaction Detail ──> Transaction Form / Exportar
STATS ──> (todo interno, scroll + gráficos)
PERFIL ──> (solo datos del usuario)
```

---

## 1. `app/_layout.tsx` — Layout Raíz

### ¿Qué hace?
Es el **primer archivo que carga Expo Router**. Envuelve toda la app y configura:
- **Navegación Stack** (sin headers visibles)
- **React Query** (`QueryClientProvider`) para caché de datos del servidor
- **Modo oscuro** mediante una clase CSS en la View raíz
- **Loading spinner** mientras Firebase determina si hay sesión activa
- **Listener de autenticación** que se ejecuta al montar el componente

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `Stack` de `expo-router` | Librería | Define la navegación tipo stack (apila pantallas) |
| `QueryClient` / `QueryClientProvider` | Librería | Maneja caché de datos del servidor (evita refetchs innecesarios) |
| `onAuthChange` de `./services/auth.service` | Propia | Escucha cambios de sesión en Firebase Auth |
| `useAuthStore` de `../store/authStore` | Propia | Store global de Zustand con el usuario actual |
| `useThemeStore` de `../store/themeStore` | Propia | Store global del tema (claro/oscuro) |

### Funciones y hooks
- **`RootLayout()`**: Componente principal. Usa `useState(false)` para `isReady` (controla si ya se verificó la sesión).
- **`useEffect(() => {...}, [])`**: Se ejecuta una vez al montar. Suscribe al listener `onAuthChange` que Firebase llama cuando el usuario inicia/cierra sesión. Al recibir un usuario (o null), actualiza el store `setAuth()` y marca `isReady = true`.
- **`onAuthChange` retorna `unsub`**: Una función que se ejecuta al desmontar el componente (cleanup) para desuscribirse.

### Flujo:
1. La app arranca → `isReady = false` → Muestra un spinner
2. Firebase verifica si hay token de sesión guardado
3. `onAuthChange` devuelve el usuario (`firebaseUser`) o `null`
4. Se actualiza `authStore` con `setAuth(firebaseUser)`
5. `isReady = true` → se renderiza el `Stack` con las pantallas

### Diagrama de flujo:
```
App inicia
    │
    ▼
useEffect → onAuthChange(listener)
    │                           │
    ▼                           ▼
isReady=false              Firebase responde
(spinner)                  user o null
    │                           │
    └────────── setAuth() ←─────┘
                    │
                    ▼
              isReady = true
                    │
                    ▼
          <Stack> se renderiza
```

---

## 2. `app/index.tsx` — Pantalla de Inicio (Landing)

### ¿Qué hace?
Pantalla de bienvenida con:
- Fondo de imagen (`fondo.jpg`)
- Nombre "Mis Finanzas" con efecto gradiente (usando `MaskedView` + `LinearGradient`)
- Botón **"Iniciar Sesión"** → navega a `/login`
- Botón **"Registrarme"** → navega a `/register`
- Botón **X** (esquina superior derecha) → cierra la app

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `BackHandler` de `react-native` | Librería | API nativa para cerrar la app en Android |
| `Platform` de `react-native` | Librería | Detecta si es Android, iOS o Web |
| `Alert` de `react-native` | Librería | Muestra carteles emergentes |
| `router` de `expo-router` | Librería | Navegación programática |
| `MaskedView` | Librería | Recorta el texto con forma de gradiente |
| `LinearGradient` | Librería | Degradado de colores |

### Funciones
- **`handleClose()`**: Decide cómo cerrar según plataforma:
  - **Android**: `BackHandler.exitApp()` → fuerza el cierre de la app
  - **Web**: `window.open('', '_self')` + `window.close()` → intenta cerrar la pestaña. Si no funciona, muestra Alert con instrucciones (Ctrl+C para server)
  - **iOS/otros**: Alert informativo (Apple no permite cierre programático)

### Estructura visual (flex-row)
```
┌─────────────────────────────────────────────┐
│  (black/50 overlay)                         │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ [X]          │  │                      │ │
│  │              │  │   Card blanca        │ │
│  │ Mis Finanzas │  │   ┌──────────────┐   │ │
│  │ (gradiente)  │  │   │ WalletCards  │   │ │
│  │              │  │   │              │   │ │
│  │ Texto desc.  │  │   │Control Gastos│   │ │
│  │              │  │   │              │   │ │
│  │              │  │   │[Iniciar Ses.]│   │ │
│  │              │  │   │[Registrarme] │   │ │
│  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 3. `app/login.tsx` — Pantalla de Login

### ¿Qué hace?
Formulario de inicio de sesión con:
- Validación con **Zod** (email válido, password ≥ 6 caracteres)
- Manejo de estado con **React Hook Form** (`useForm` + `Controller`)
- Botón para mostrar/ocultar contraseña (`Eye` / `EyeOff`)
- Manejo de errores de Firebase traducidos al español

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `useForm`, `Controller` de `react-hook-form` | Librería | Maneja formularios sin re-renders innecesarios |
| `zodResolver` de `@hookform/resolvers` | Librería | Conecta Zod con React Hook Form |
| `z` de `zod` | Librería | Define esquemas de validación |
| `login` de `./services/auth.service` | Propia | Función que llama a Firebase Auth |
| `KeyboardAvoidingView` | Librería | Empuja el contenido cuando el teclado aparece |

### Esquema Zod (`loginSchema`)
```typescript
z.object({
  email: z.string().email('Ingrese un email valido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
```

### Funciones
- **`onSubmit(data: LoginForm)`**: Async. Llama a `login(email, password)`. Si Firebase responde bien, hace `router.replace('/dashboard')`. Si falla, captura el error y muestra un Alert con mensaje amigable según el `error.code` de Firebase.

### Manejo de errores de Firebase
| Código Firebase | Mensaje al usuario |
|-----------------|-------------------|
| `auth/user-not-found` | Email o contraseña incorrectos |
| `auth/wrong-password` | Email o contraseña incorrectos |
| `auth/invalid-email` | Email invalido |
| Otros | Error al iniciar sesion |

### Estados del formulario
- **`isSubmitting`**: Booleano que provee `useForm`. `true` mientras se envía. Deshabilita el botón y muestra "Ingresando..."

---

## 4. `app/register.tsx` — Pantalla de Registro

### ¿Qué hace?
Formulario de registro con 5 campos:
- Nombre (≥ 5 caracteres)
- Teléfono (≥ 8 caracteres)
- Email (válido)
- Contraseña (≥ 5 chars, 1 mayúscula, 1 número)
- Confirmar contraseña (debe coincidir)
- Validación con Zod (incluye `refine` para comparar contraseñas)

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `register as registerUser` de `auth.service` | Propia | Alias para no confundir con `register` de React |
| `ScrollView` de `react-native` | Librería | Permite scroll cuando el teclado oculta campos |
| `UserPlus` de `lucide-react-native` | Librería | Icono del formulario |

### Esquema Zod extendido
```typescript
z.object({
  name: z.string().min(5),
  telefono: z.string().min(8),
  email: z.string().email(),
  password: z.string()
    .min(5)
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
```

### Funciones
- **`onSubmit(data: RegisterForm)`**: Llama a `registerUser(name, email, password, telefono)` del service. En Firebase:
  1. Crea el usuario con `createUserWithEmailAndPassword`
  2. Actualiza el perfil con `updateProfile` (guarda el `displayName`)
  3. Genera un ID numérico autoincremental con `getNextNumericId('userIdCounter')`
  4. Guarda en Firestore: `users/{id}` con nombre, teléfono, email, uid
  5. Redirige a `/dashboard`

---

## 5. `app/(tabs)/dashboard.tsx` — Dashboard Principal

### ¿Qué hace?
Pantalla principal post-login. Muestra:
- **Resumen de saldos** (ingresos, gastos, balance) desde `transactions`
- **Acciones rápidas**: botón para registrar nuevo movimiento
- **Transacciones recientes** (últimas 3)
- **Estado vacío** si no hay transacciones
- La navegación (sidebar + BottomNav) la provee el layout compartido `app/(tabs)/_layout.tsx`; la pantalla ya **no** se envuelve en `<SidebarLayout>` por sí misma.

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `useFocusEffect` de `expo-router` | Librería | Ejecuta código cada vez que la pantalla recibe foco (vuelve de otra pantalla) |
| `getTransactions` de `transaction.service` | Propia | Obtiene todas las transacciones del usuario desde Firestore |
| `getCategoryConfig` de `constants/transactions` | Propia | Devuelve icono y colores según categoría |
| `useMemo` de React | Librería | Memoriza cálculos costosos (solo se recalcula si cambian `transactions`) |

### Estado local
- **`transactions: Transaction[]`**: Lista completa de transacciones
- **`isLoading: boolean`**: Controla el spinner inicial
- **`totalIncome, totalExpense, recentTransactions`**: Calculados con `useMemo`

### Funciones
- **`loadTransactions()`**: Async. Llama a `getTransactions()` → actualiza `transactions` y pone `isLoading = false`.
- **`useFocusEffect`**: Reactivo. Cada vez que la pantalla gana foco, vuelve a cargar transacciones (útil si volvemos de crear/editar una transacción).
- **`renderEmptyState()`**: Devuelve JSX con un mensaje amigable y botón para crear el primer movimiento.
- **`renderRecentTransaction(item: Transaction)`**: Pinta una tarjeta con icono de categoría, título, fecha y monto.
- **Cálculo de balance**: `balance = totalIncome - totalExpense`. Si es positivo → verde, si es negativo → rojo.

### Diagrama de carga:
```
useFocusEffect → loadTransactions()
                      │
                      ▼
              getTransactions() ← Firebase
                      │
                      ▼
              setTransactions(result)
                      │
                      ▼
              useMemo recalcula:
                totalIncome, totalExpense,
                recentTransactions (top 3 por fecha)
                      │
                      ▼
              Renderiza resumen + lista
```

---

## 6. `app/(tabs)/transacciones.tsx` — Lista de Transacciones

### ¿Qué hace?
Pantalla con **lista completa** de movimientos con filtros:
- **Búsqueda** por texto (título, categoría, nota)
- **Filtro por tipo**: Todos / Ingresos / Gastos
- **Filtro por categoría**: Todas / [cada categoría]
- **Filtro por fecha**: Todas / Hoy / Este mes / Personalizado (rango DD/MM/AAAA)
- Pull-to-refresh para recargar
- Botón "+" para crear nuevo movimiento
- Contador de resultados filtrados

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `FlatList` de `react-native` | Librería | Lista virtualizada (solo renderiza items visibles, mejor performance) |
| `RefreshControl` de `react-native` | Librería | Control de pull-to-refresh |
| `Search`, `Filter`, `CalendarDays`, `Plus` | Librería | Iconos |
| `formatDateInput`, `parseTransactionDate`, `transactionCategories` de constants | Propia | Formateo y parseo de fechas, lista de categorías |

### Estado y filtros
```typescript
const [search, setSearch] = useState('');           // Texto de búsqueda
const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
const [categoryFilter, setCategoryFilter] = useState('Todas');
const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'custom'>('all');
const [dateFrom, setDateFrom] = useState('');       // Fecha inicio (custom)
const [dateTo, setDateTo] = useState('');           // Fecha fin (custom)
```

### Funciones clave
- **`filteredTransactions`** (useMemo): Filtra `transactions` aplicando TODOS los filtros activos simultáneamente. Cada filtro es un `&&` en el `filter`.
- **`renderTransaction({ item })`**: Cada item es un `TouchableOpacity` que navega a `/transaction-detail?id=...`
- **`handleRefresh()`**: Recarga datos para pull-to-refresh
- **`formatAmount(transaction)`**: Devuelve string con signo (+/-) y 2 decimales

### Componente `ListHeader`
Es el encabezado del `FlatList`. Contiene:
1. Barra de búsqueda + botón "+"
2. Filtros de tipo (chips horizontales con `ScrollView`)
3. Filtros de categoría (chips horizontales)
4. Filtros de fecha (chips horizontales)
5. Filtro personalizado (inputs de fecha, solo si `dateFilter === 'custom'`)
6. Contador de resultados

---

## 7. `app/(tabs)/stats.tsx` — Estadísticas y Presupuestos

### ¿Qué hace?
Pantalla de reportes con:
- **Balance** general en grande
- **Tarjetas** de Ingresos y Gastos
- **Gráfico de torta** (PieChart) de balance general (gastado vs disponible)
- **Gráfico de torta** de distribución de gastos por categoría
- **Presupuestos por categoría**: barra de progreso, indicador de alerta si ≥ 80%, lápiz para editar

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `PieChart` de `react-native-chart-kit` | Librería | Renderiza gráficos de torta |
| `calculateStats` de `../utils/stats` | Propia | Función pura que calcula estadísticas |
| `useBudgetStore` de `../store/budgetStore` | Propia | Store con límites de presupuesto por categoría |
| `transactionCategories` de constants | Propia | Lista de categorías para presupuestos |

### Funciones
- **`loadTransactions()`**: Carga datos de Firebase (igual que en dashboard)
- **`stats` (useMemo)**: Llama a `calculateStats(transactions)` que devuelve:
  - `income`: suma de ingresos
  - `expenses`: suma de gastos
  - `balance`: income - expenses
  - `expensesByCategory`: array de [categoría, monto] ordenado
  - `pieData`: datos formateados para el gráfico de torta
  - `balancePieData`: datos del gráfico balance
- **`handleSetBudget(category)`**: Guarda el presupuesto en el store `budgetStore`
- **`promptBudget(category, currentLimit)`**: Activa el modo edición del presupuesto

### Presupuestos (Zustand)
El store `budgetStore` guarda un objeto `Record<string, number>`:
```typescript
{ "Alimentacion": 50000, "Transporte": 10000, ... }
```
Cada categoría muestra:
- Gasto actual / Límite
- Barra de progreso (verde normal, rojo si ≥ 80%)
- Icono de advertencia si está cerca del límite
- Lápiz para editar el límite

### Gráficos (react-native-chart-kit)
El `PieChart` recibe:
```typescript
data = [
  { name: string, value: number, color: string, legendFontColor: string, legendFontSize: number }
]
```

---

## 8. `app/(tabs)/perfil.tsx` — Perfil del Usuario

### ¿Qué hace?
Muestra datos del usuario autenticado:
- **Avatar** con iniciales (ej: "JD" para "Juan Díaz")
- **Nombre** (de `displayName`)
- **Email**
- **Fecha de creación de la cuenta** (de `user.metadata.creationTime`)
- **Estado de sesión** (activa)

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `useAuthStore` | Propia | Obtiene el usuario actual del store global |

### Datos derivados
```typescript
const initials = displayName
  .split(' ')              // ["Juan", "Díaz"]
  .filter(Boolean)         // Elimina vacíos
  .slice(0, 2)             // Toma hasta 2 palabras
  .map((part) => part[0]?.toUpperCase())  // ["J", "D"]
  .join('') || 'U';        // "JD"

const creationDate = user?.metadata.creationTime
  ? new Date(user.metadata.creationTime).toLocaleDateString('es-AR')
  : 'No disponible';
```

---

## 9. `app/transaction-form.tsx` — Formulario de Transacciones

### ¿Qué hace?
Formulario completo para crear/editar movimientos:
- **Tipo**: Gasto / Ingreso / Compartido
- **Monto** (con input numérico)
- **Título**
- **Gasto Compartido** (si seleccionó tipo "Compartido"):
  - Buscar usuario por teléfono en Firestore
  - Agregar/eliminar amigos
  - Distribuir montos (mi parte / parte por amigo)
  - Validación de que la suma coincida con el total
- **Fecha** (formato DD/MM/AAAA con validación y animación "shake" si es inválida)
- **Categoría** (selección visual con iconos)
- **Nota** (campo multilinea)
- **Foto** (desde galería con `expo-image-picker`)

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `useLocalSearchParams` de `expo-router` | Librería | Lee parámetros de la URL (`id`, `type`) |
| `ImagePicker` de `expo-image-picker` | Librería | Acceso a la galería de fotos |
| `Animated` de `react-native` | Librería | Animación de "shake" en fecha inválida |
| `addTransaction`, `updateTransaction`, `getTransactionById` | Propia | CRUD de Firestore |
| `useAuthStore` | Propia | Usuario actual para asociar transacciones |
| `collection`, `doc`, `getDocs`, `query`, `where` de Firebase | Librería | Consultas a Firestore |
| `formatDateInput`, `parseTransactionDate` | Propia | Formateo y validación de fecha |

### Estados clave
```typescript
const [title, setTitle] = useState('');              // Título
const [amount, setAmount] = useState('');            // Monto (string para input)
const [type, setType] = useState<TransactionType>(); // Tipo
const [category, setCategory] = useState('');        // Categoría
const [date, setDate] = useState('');                // Fecha
const [note, setNote] = useState('');                // Nota opcional
const [photoUri, setPhotoUri] = useState('');        // URI de foto
const [sharedPhone, setSharedPhone] = useState('');  // Teléfono a buscar
const [usuariosCompartidos, setUsuariosCompartidos] = useState<SharedUser[]>([]); // Amigos agregados
const [myShare, setMyShare] = useState('');          // Mi parte del gasto
const [isLoading, setIsLoading] = useState(Boolean(id)); // Modo edición?
const [isSaving, setIsSaving] = useState(false);     // Guardando?
```

### Funciones clave

**`handleTypeChange(nextType)`**: Cambia el tipo y resetea la categoría:
- Si es `income` → categoría "Ingresos"
- Si es `expense`/`shared` → categoría "Alimentacion"

**`handleSearchSharedUser()`**: Busca un usuario en Firestore por teléfono:
```
users collection → where('telefono', '==', sharedPhone) → getDocs
```
Si encuentra, guarda el candidato en `sharedCandidate`.

**`handleSave()`**: Función principal que:
1. Valida datos obligatorios (título, monto, categoría, fecha)
2. Valida monto > 0
3. Valida fecha con `parseTransactionDate`
4. Valida sesión activa
5. Si es **compartido**:
   - Calcula distribución: `miParte + (parteAmigo * cantAmigos) === total`
   - Crea transacción para el creador (con `userId` del creador)
   - Crea transacciones para cada amigo (con `userId` del amigo)
   - Actualiza saldo/gastos de cada amigo en Firestore
6. Si es **edición**: llama a `updateTransaction(id, payload)`
7. Si es **nuevo**: llama a `addTransaction(payload)`
8. Redirige según el caso

**`handleDateChange(value)`**: Formatea la fecha automáticamente mientras el usuario escribe (agrega las "/") y valida visualmente.

**`handlePickPhoto()`**: Pide permisos de galería y permite seleccionar imagen.

**`triggerShake()`**: Animación que mueve el input de fecha horizontalmente si es inválida.

### Distribución de gasto compartido
```
total = $1000
amigos = [Juan, María]

miParte = $400
parteAmigo = (1000 - 400) / 2 = $300

Validación: 400 + 300 * 2 = 1000 ✓
```

---

## 10. `app/transaction-detail.tsx` — Detalle de Transacción

### ¿Qué hace?
Muestra todos los datos de una transacción:
- Icono de categoría + título + monto
- Tipo y categoría
- Fecha
- Detalle compartido (si aplica): total original, pagado por mí, pagado por cada amigo
- Nota
- Foto (si tiene)
- Botón **Editar** (lápiz) → navega a `/transaction-form?id=...`
- Botón **Eliminar** (tacho) → confirmación → `deleteTransaction(id)` → redirige a `/dashboard`
- Botón **Exportar CSV** → navega a `/exportar?transactionId=...`

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `useFocusEffect` | Librería | Recarga datos al recibir foco |
| `useLocalSearchParams` | Librería | Lee `id` de la URL |
| `deleteTransaction`, `getTransactionById` | Propia | CRUD |
| `getCategoryConfig` | Propia | Icono/colores de categoría |

### Funciones clave

**`handleDelete()`**: Muestra confirmación (usa `window.confirm` en web, `Alert.alert` en mobile). Si confirma:
1. `setIsDeleting(true)`
2. `deleteTransaction(id)` → cambia `status` a `'eliminado'` en Firestore (soft delete)
3. Espera 500ms y redirige a `/dashboard`

### Datos compartidos
```typescript
const myShare = currentUserId === transaction.creatorUid
  ? transaction.parteCreador ?? 0   // Si soy el creador
  : transaction.parteAmigo ?? 0;     // Si soy el amigo

const otherParticipants = sharedFriends.filter(
  (friend) => friend.uid !== currentUserId
);
```

---

## 11. `app/(tabs)/exportar.tsx` — Exportar CSV

### ¿Qué hace?
Pantalla para exportar movimientos a CSV:
- Selector de rango de fechas (últimos 90 días por defecto)
- Filtra transacciones por fecha
- Si viene `transactionId` en params, exporta solo esa transacción
- Genera archivo CSV y lo comparte usando `expo-sharing`

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `Sharing` de `expo-sharing` | Librería | Comparte archivos con otras apps |
| `generateAndDownloadCSV` de `export.service` | Propia | Genera el archivo CSV |
| `input` HTML (web) | Nativo | Selector de fecha tipo `<input type="date">` |

### Funciones
**`handleExport()`**: 
1. Filtra transacciones por fecha (parsea fechas en formato DD/MM/AAAA)
2. Si hay `transactionId`, filtra por ID
3. Llama a `generateAndDownloadCSV(finalTransactions, fileName)`
4. Muestra Alert de éxito

---

## 12. `components/SidebarLayout.tsx` — Sidebar de Navegación

### ¿Qué hace?
Layout envolvente que provee la navegación principal. **Se renderiza una sola
vez** desde `app/(tabs)/_layout.tsx` alrededor de un `<Slot/>`, por lo que el
nav permanece montado y fijo al cambiar de pantalla (antes cada pantalla
montaba su propio `SidebarLayout`, lo que hacía que el nav parpadeara).

- **Desktop/tablet** (ancho ≥ 768): **sidebar izquierdo** con:
  - Enlaces: Dashboard, Transacciones, Stats, Exportar, Perfil
  - Modo oscuro/claro (`toggleTheme`)
  - **Cerrar Sesión** → llama a `logout()` → navega a `/` (pantalla principal)
- **Mobile** (ancho < 768): renderiza `BottomNav` (barra inferior fija).
- **Área de contenido**: el `<Slot/>` con la pantalla activa.

La navegación entre pestañas usa `router.replace` (no `push`) para no apilar
historial y mantener el layout/nav montado.

### Imports clave
| Import | Tipo | ¿Para qué? |
|--------|------|------------|
| `router` de `expo-router` | Librería | Navegación |
| `logout` de `auth.service` | Propia | Cierra sesión en Firebase |
| `useThemeStore` | Propia | Tema actual |
| Iconos: `Home`, `List`, `BarChart3`, `User`, `LogOut`, `Moon`, `Sun` | Librería | Iconos del menú |

### Props
```typescript
type Props = {
  active: 'dashboard' | 'transacciones' | 'stats' | 'exportar' | 'perfil';
  children: React.ReactNode;
};
```
- **`active`**: qué pestaña está activa (se resalta visualmente)
- **`children`**: contenido de la pantalla

### Funciones
- **`handleLogout()`**: Async. Llama a `logout()` (Firebase `signOut`). Después navega a `'/'` (pantalla de inicio) con `router.replace` (no deja rastro en el stack).

---

## 13. `services/firebase.ts` — Configuración de Firebase

### ¿Qué hace?
Inicializa la app de Firebase con variables de entorno y exporta:
- `auth`: instancia de autenticación
- `db`: instancia de Firestore
- `storage`: instancia de Storage
- `getNextNumericId(counterName)`: genera IDs autoincrementales usando transacciones de Firestore

### Variables de entorno
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};
```

### `getNextNumericId(counterName)`
Usa `runTransaction` de Firestore para garantizar IDs únicos:
1. Lee el documento `counters/{counterName}`
2. Toma el valor actual (o 0 si no existe)
3. Incrementa en 1
4. Guarda el nuevo valor
5. Retorna el nuevo ID

---

## 14. `services/auth.service.ts` — Servicio de Autenticación

### ¿Qué hace?
Capa intermedia entre el frontend y Firebase Auth. Expone 4 funciones:

| Función | ¿Qué hace? |
|---------|------------|
| `login(email, password)` | Llama a `signInWithEmailAndPassword`, retorna `User` |
| `register(name, email, password, phone)` | Crea usuario + actualiza perfil + guarda en Firestore + retorna `User` |
| `logout()` | Llama a `signOut` |
| `onAuthChange(callback)` | Suscribe listener a `onAuthStateChanged`, retorna función para desuscribirse |

### Flujo de `register()`:
1. `createUserWithEmailAndPassword(auth, email, password)` → crea en Firebase Auth
2. `updateProfile(result.user, { displayName: name })` → guarda nombre en el perfil de Auth
3. `getNextNumericId('userIdCounter')` → obtiene ID numérico único
4. `setDoc(doc(db, 'users', String(nextId)), { id, uid, nombre, telefono, email, createdAt })` → guarda datos extra en Firestore

---

## 15. `services/transaction.service.ts` — CRUD de Transacciones

### ¿Qué hace?
Operaciones sobre la colección `transactions` de Firestore:

| Función | ¿Qué hace? |
|---------|------------|
| `getTransactions()` | Query: `userId == user.uid AND status == 'agregado'` |
| `getTransactionById(id)` | Obtiene una transacción por ID (verifica ownership) |
| `addTransaction(transaction)` | Genera ID autoincremental y guarda con `status: 'agregado'` |
| `updateTransaction(id, data)` | Actualiza campos (verifica ownership) |
| `deleteTransaction(id)` | Soft delete: cambia `status` a `'eliminado'` |

### Tipo `Transaction`
```typescript
type Transaction = {
  id: number;
  type: 'income' | 'expense' | 'shared';
  amount: number;
  title: string;
  date?: string;          // Formato DD/MM/AAAA
  category?: string;
  note?: string;
  photoUri?: string;
  userId: string;         // UID del dueño
  status: 'agregado' | 'eliminado';
  // Campos para gasto compartido:
  myShare?: number;
  creatorUid?: string;
  creatorNombre?: string;
  amigoUid?: string;
  amigoNombre?: string;
  parteCreador?: number;
  parteAmigo?: number;
  sharedWith?: { uid, phone, name, amount };
  detalleCompartido?: {
    total: number;
    pagadoPorMi: number;
    pagadoPorAmigo: number;
    amigos?: Array<{ uid, nombre, telefono, email, amount }>;
  };
};
```

### Seguridad
Cada función verifica:
- Que `auth.currentUser` exista (sesión activa)
- Que `transaction.userId === user.uid` (ownership)

---

## 16. Stores de Zustand — Estado Global

### `authStore.ts`
```typescript
interface AuthState {
  user: User | null;           // Usuario de Firebase (o null)
  setAuth: (user: User | null) => void;
}
```

### `themeStore.ts`
```typescript
type Theme = 'light' | 'dark';
interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;  // Fija el tema explícitamente
  toggleTheme: () => void;           // Alterna entre light/dark
}
```
- **Persiste** el tema en AsyncStorage (`persist` middleware), igual que
  `budgetStore`. Al reiniciar la app se conserva la elección del usuario.
- Cada cambio llama a `colorScheme.set(theme)` de **NativeWind** para que las
  variantes `dark:` se activen de verdad en iOS/Android/web (antes sólo
  cambiaba el ícono pero la apariencia no se aplicaba). En `app/_layout.tsx`
  un `useEffect([theme])` re-aplica el `colorScheme` y se ajusta el fondo raíz.

### `budgetStore.ts`
```typescript
interface BudgetState {
  budgets: Record<string, number>;  // { "Alimentacion": 50000, ... }
  setBudget: (category: string, limit: number) => void;
  removeBudget: (category: string) => void;
}
```

---

## 17. `utils/stats.ts` — Cálculos de Estadísticas

### ¿Qué hace?
Función pura `calculateStats(transactions)` que calcula:

| Propiedad | Descripción |
|-----------|-------------|
| `income` | Suma de montos de transacciones tipo `income` |
| `expenses` | Suma de montos de tipo `expense` + `shared` |
| `balance` | `income - expenses` |
| `expensesByCategory` | Array `[categoria, monto]` ordenado por monto descendente |
| `pieData` | Array formateado para PieChart: `{ name, value, color, legendFontColor, legendFontSize }` |
| `balancePieData` | Array con 2 entries: "Gastado" y "Disponible" |

### Colores del gráfico
```typescript
const PIE_COLORS = ['#f43f5e', '#10b981', '#2563eb', '#9333ea', '#d97706', '#dc2626', '#059669', '#0ea5e9'];
```

---

## 18. `constants/transactions.ts` — Configuración de Categorías

### ¿Qué hace?
Define las 7 categorías con su nombre, icono y colores:

| Categoría | Icono | Color Icono | Fondo |
|-----------|-------|-------------|-------|
| Alimentacion | ShoppingCart | `#f43f5e` | `bg-rose-100` |
| Transporte | Car | `#10b981` | `bg-emerald-100` |
| Hogar | Home | `#2563eb` | `bg-blue-100` |
| Servicios | MonitorSmartphone | `#9333ea` | `bg-purple-100` |
| Salud | HeartPulse | `#dc2626` | `bg-red-100` |
| Ocio | Coffee | `#d97706` | `bg-amber-100` |
| Ingresos | Wallet | `#059669` | `bg-emerald-100` |

### Funciones auxiliares
- **`getCategoryConfig(category)`**: Busca la categoría por nombre, devuelve la primera (Alimentacion) si no encuentra.
- **`formatDateInput(value)`**: Mientras el usuario escribe, inserta las "/" automáticamente: `15` → `15`, `1511` → `15/11`, `15112004` → `15/11/2004`.
- **`parseTransactionDate(value)`**: Convierte string `DD/MM/AAAA` a `Date`. Valida día, mes, año. Retorna `null` si es inválido.

---

## Resumen de Tecnologías

| Tecnología | Uso en el proyecto |
|------------|-------------------|
| **Expo SDK 54** | Framework base para React Native |
| **Expo Router** | Navegación file-based (cada archivo en `app/` es una ruta) |
| **Firebase Auth** | Autenticación (email/contraseña) |
| **Firebase Firestore** | Base de datos NoSQL (usuarios, transacciones, contadores) |
| **Zustand** | Estado global liviano (auth, theme, budgets) |
| **React Hook Form** | Manejo de formularios sin re-renders |
| **Zod** | Validación de esquemas en frontend |
| **TanStack Query** | Caché y sincronización de datos del servidor |
| **NativeWind (Tailwind)** | Estilos utility-first |
| **react-native-chart-kit** | Gráficos de torta en Stats |
| **expo-image-picker** | Selección de fotos desde galería |
| **expo-sharing** | Compartir archivos CSV |
| **lucide-react-native** | Iconos vectoriales |
| **Vitest** | Testing unitario |

---

## Conceptos clave para la entrega

### ¿Qué es Expo Router?
Es un sistema de navegación **basado en archivos**. Cada archivo `.tsx` dentro de `app/` se convierte automáticamente en una ruta. Ej: `app/login.tsx` → ruta `/login`. El archivo `app/_layout.tsx` es el layout raíz que envuelve todas las rutas.

### ¿Qué es Zustand?
Una biblioteca de **estado global** para React. Es más simple que Redux. Con `create()` creás un store con estado inicial y funciones para modificarlo. Los componentes se suscriben con hooks (`useAuthStore(state => state.user)`).

### ¿Qué es Zod?
Una biblioteca de **validación de esquemas**. Definís un esquema (por ej: email string, password string min 6) y Zod verifica que los datos cumplan. Se integra con React Hook Form mediante `zodResolver`.

### ¿Qué es Firebase?
Plataforma de Google que provee:
- **Auth**: autenticación de usuarios (login, registro, sesión)
- **Firestore**: base de datos NoSQL en tiempo real (colecciones: `users`, `transactions`, `counters`)
- **Storage**: almacenamiento de archivos (no usado activamente en esta versión)

### Soft Delete
En lugar de borrar físicamente un documento de Firestore, se cambia el campo `status` a `'eliminado'`. Las queries filtran por `status === 'agregado'`. Esto permite recuperación ante eliminaciones accidentales.

### IDs autoincrementales
Firestore no tiene autoincrement. Se implementó con un documento contador (`counters/transactionIdCounter`) que se incrementa atómicamente usando `runTransaction` (operación atómica de lectura+escritura).

### Arquitectura de capas
```
Pantallas (app/*.tsx)  ←  Solo se comunican con services
      │
      ▼
Services (services/*.ts)  ←  Capa intermedia con Firebase
      │
      ▼
Firebase (services/firebase.ts)  ←  Configuración e inicialización
```
Las pantallas **nunca importan Firebase directamente**. Siempre pasan por los services. Esto se llama **separación de responsabilidades**.
