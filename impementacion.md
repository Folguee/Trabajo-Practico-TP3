¡Excelente propuesta! Tienes muy bien definidos los requerimientos para el Trabajo Práctico. El proyecto actual ya utiliza Expo Router (basado en la carpeta `app/`) y parece tener configuraciones básicas para Firebase y Tailwind (NativeWind).

Aquí tienes el plan detallado de implementación paso a paso, diseñado para ejecutarse en modo de acción.

### 1. Resumen General

La aplicación "Control de Gastos Personales" se construirá sobre la base existente de Expo Router y NativeWind. Implementaremos un flujo completo de autenticación (Login/Registro), un Dashboard interactivo, gestión de movimientos (CRUD), toma de fotografías para tickets usando la cámara, estadísticas de gastos e ingresos, y la exportación de reportes en formato CSV con capacidad de envío por correo o compartir.

### 2. Cambios Principales (Archivos a modificar/crear)

- __Autenticación y Rutas__: Modificar `app/_layout.tsx`, crear flujo de tabs en `app/(tabs)/_layout.tsx`, mover pantallas principales.

- __Servicios (Firebase)__: Configurar `services/firebase.ts` (Firestore y Storage), `services/transaction.service.ts` para el CRUD.

- __Modelos__: Definir interfaces TS en `types/index.ts` (Transaction, Category, User).

- __Pantallas (Screens)__:

  - `app/(auth)/login.tsx` y `app/(auth)/register.tsx`
  - `app/(tabs)/dashboard.tsx`
  - `app/(tabs)/transactions/index.tsx` (Listado)
  - `app/(tabs)/transactions/form.tsx` (Alta/Edición con cámara)
  - `app/(tabs)/transactions/[id].tsx` (Detalle)
  - `app/(tabs)/stats.tsx`
  - `app/(tabs)/export.tsx`
  - `app/(tabs)/profile.tsx`

- __Utilidades__: Funciones para cálculos, formato de fechas/moneda y exportación CSV.

### 3. Pasos de Implementación

1. __Configuración Inicial y Dependencias__: Instalar paquetes necesarios: `expo-image-picker`, `expo-file-system`, `expo-sharing`, `date-fns` (para fechas). Configurar las variables de entorno de Firebase.

2. __Modelos y Tipos__: Definir las interfaces TypeScript en `types/index.ts` (`User`, `Transaction`, `Category`).

3. __Servicios de Firebase__:

   - Implementar autenticación en `services/auth.service.ts` y conectarlo con `store/authStore.ts` (Zustand).
   - Configurar el servicio CRUD en `services/transaction.service.ts` (Firestore) y la subida de imágenes a Storage.

4. __Navegación y Layouts__: Reestructurar el proyecto usando Expo Router:

   - Crear grupo `(auth)` para login/registro.
   - Crear grupo `(tabs)` para la navegación principal inferior.

5. __Pantallas de Autenticación__: Implementar `login.tsx` y `register.tsx` con formularios controlados y validaciones.

6. __Dashboard__: Implementar `dashboard.tsx` que muestre el resumen general y los últimos movimientos utilizando componentes UI reutilizables.

7. __CRUD de Transacciones (Parte 1: Listado)__: Implementar la pantalla principal de transacciones mostrando una `FlatList`, con filtros básicos.

8. __CRUD de Transacciones (Parte 2: Formulario y Cámara)__: Crear la pantalla `form.tsx`. Integrar `expo-image-picker` para solicitar permisos y capturar la foto del comprobante. Subir imagen a Storage y guardar el documento en Firestore.

9. __CRUD de Transacciones (Parte 3: Detalle y Eliminación)__: Implementar la vista de detalle `[id].tsx` y permitir la eliminación.

10. __Estadísticas__: Implementar `stats.tsx`. Obtener transacciones del mes, calcular totales e ingresos vs gastos por categoría.

11. __Exportación (CSV & Share)__: Implementar `export.tsx`. Generar CSV en local usando `expo-file-system` y abrir el diálogo nativo usando `expo-sharing`.

12. __Perfil__: Implementar `profile.tsx` para mostrar datos y permitir cerrar sesión.

13. __Pulido y Diseño__: Revisar validaciones de los formularios, estados de carga y manejo de errores. Ajustar el diseño con NativeWind para que sea consistente.

### 4. Consideraciones Técnicas

- __Manejo de Imágenes__: Se usará `expo-image-picker` para la cámara/galería. Las imágenes se comprimirán/redimensionarán antes de subirse a Firebase Storage para evitar consumo excesivo.
- __Expo Router__: Aprovecharemos el enrutamiento basado en archivos para separar la parte pública (Auth) de la privada (Tabs).
- __Estado Global__: Se utilizará Zustand (parece que ya hay un `authStore.ts`) para mantener el usuario activo y evitar props-drilling.
- __Permisos__: Se deben solicitar explícitamente permisos de cámara (`Permissions.askAsync`) en Android/iOS.

### 5. Criterios de Éxito

- Un usuario puede registrarse, iniciar sesión y cerrar sesión correctamente.
- El usuario puede crear un gasto/ingreso, sacarle una foto al ticket, y este se guarda exitosamente en Firebase.
- Se visualizan listados y estadisticas de manera correcta con información real de la base de datos.
- El usuario puede generar un archivo CSV y la app levanta el menú nativo para compartirlo (mail, whatsapp, etc).
- La UI no se rompe en estado de carga o error, informando debidamente al usuario.

---

¿Qué te parece este plan? Si estás de acuerdo con la estrategia, por favor __cambia al modo "Act" (Act Mode)__ usando el botón correspondiente (el interruptor Plan/Act en la interfaz) y envíame un mensaje para comenzar de inmediato con la ejecución de estos pasos.
