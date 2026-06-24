# Reglas temporales de Firestore para cargar datos

Copiá y pegá esto en las reglas de Firestore mientras ejecutamos el script de carga:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Importante
Estas reglas dejan la base totalmente abierta. Usalas solo de forma temporal para correr el script:

```bash
node scripts/rewrite-transactions.mjs --apply
```

Después de terminar, volvé a poner las reglas seguras del proyecto.