# Trabajo-Practico-TP3

# 📱 Control de Gastos Personales - React Native & Firebase

Proyecto desarrollado para el **TP3** de la carrera de Analista de Sistemas (ORT). La aplicación permite la gestión integral de finanzas personales con persistencia en la nube y servicios nativos.

---

## 🚀 Objetivo y Tecnologías
| Sección | Descripción |
| :--- | :--- |
| **Objetivo** | Registrar ingresos/gastos, consultar reportes, adjuntar comprobantes y exportar CSV. |
| **Stack** | React Native (Expo), Firebase (Auth, Firestore, Storage). |
| **Servicios S.O.** | Cámara (comprobantes) y Compartir (exportación CSV). |

---

## 🛠️ Stack Técnico Detallado
*   **Frontend:** React Native + Expo.
*   **Navegación:** React Navigation (Stack & Tabs).
*   **Backend (BaaS):** 
    *   *Firebase Auth:* Gestión de usuarios.
    *   *Cloud Firestore:* Base de datos NoSQL para transacciones.
    *   *Firebase Storage:* Almacenamiento de imágenes de tickets.
*   **Exportación:** `expo-file-system` + `expo-sharing`.

---

## 📊 Alcance Funcional (CRUD)
1.  **Create:** Registro de movimientos con foto opcional desde la cámara.
2.  **Read:** Listado histórico filtrado por usuario y fecha.
3.  **Update:** Edición de montos, categorías o notas.
4.  **Delete:** Eliminación física de registros y archivos asociados.

## 📈 Métricas e Inteligencia
La app calcula dinámicamente:
*   Balance total (Ingresos - Gastos).
*   Gastos agrupados por categoría (Comida, Transporte, etc.).
*   Promedios diarios y mensuales.
*   Exportación a formato **CSV** para uso en Excel/Sheets.

---

## 📁 Estructura del Proyecto
```text
src/
 ├── components/    # UI Reutilizable (Cards, Buttons)
 ├── navigation/    # Configuración de Rutas
 ├── screens/       # Pantallas principales
 ├── services/      # Lógica de Firebase y API
 └── utils/         # Formateo de moneda y fechas
