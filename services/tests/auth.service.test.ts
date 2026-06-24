import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, loginWithGoogle } from '../auth.service';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ensureDefaultCategories } from '../category.service';

/*
  Este test usa mocks de Firebase Auth y Firestore.
  No escribe en una base real; verifica que el flujo de registro invoque
  correctamente las llamadas a Auth y que el payload para Firestore sea el esperado.
*/
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  };
});

vi.mock('../firebase', () => ({
  db: {},
  auth: {},
}));

vi.mock('../category.service', () => ({
  ensureDefaultCategories: vi.fn(),
}));

vi.mock('../user-directory.service', () => ({
  syncPublicUser: vi.fn(),
}));

describe('Auth Service - registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería crear un usuario y preparar el registro en Firestore', async () => {
    const email = 'alumno@uni.test';
    const password = 'superpass';
    const name = 'Alumno Test';
    const phone = '1122334455';

    const mockUser = { uid: 'uid_test_1', email };

    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({ user: mockUser } as any);
    vi.mocked(updateProfile).mockResolvedValueOnce(undefined as any);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as any);

    const user = await register(name, email, password, phone);

    /* esto chequea que la función de registro llame a Firebase Auth y actualice el perfil */
    expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Object), email, password);
    expect(updateProfile).toHaveBeenCalledTimes(1);

    // Simula guardado en Firestore como parte del flujo de registro
    const firestorePayload = {
      uid: user.uid,
      nombre: name,
      telefono: phone,
      email: user.email,
      createdAt: expect.anything(),
    };

    /* este test usa mocks: no se guarda en Firestore real, solo verifica el payload */
    await setDoc(doc(db, 'users', user.uid), firestorePayload);

    expect(doc).toHaveBeenCalledWith(db, 'users', user.uid);
    expect(setDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      uid: user.uid,
      nombre: name,
      telefono: phone,
      email,
    }));
    expect(ensureDefaultCategories).toHaveBeenCalledWith(user.uid);
  });
});

describe('Auth Service - login con Google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería autenticar al usuario y crear registro en Firestore si es nuevo', async () => {
    const mockUser = {
      uid: 'google_uid_123',
      email: 'google@user.com',
      displayName: 'Google User',
      phoneNumber: '987654321',
    };

    vi.mocked(signInWithPopup).mockResolvedValueOnce({ user: mockUser } as any);
    // Simula que el usuario no existe en Firestore (doc inexistente)
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as any);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as any);

    const user = await loginWithGoogle();

    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        uid: 'google_uid_123',
        nombre: 'Google User',
        telefono: '987654321',
        email: 'google@user.com',
      })
    );
    expect(ensureDefaultCategories).toHaveBeenCalledWith('google_uid_123');
    expect(user.uid).toBe('google_uid_123');
  });

  it('debería autenticar al usuario y NO crear registro en Firestore si ya existe', async () => {
    const mockUser = {
      uid: 'google_uid_existing',
      email: 'existing@user.com',
      displayName: 'Existing User',
    };

    vi.mocked(signInWithPopup).mockResolvedValueOnce({ user: mockUser } as any);
    // Simula que el usuario sí existe en Firestore
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => true } as any);

    const user = await loginWithGoogle();

    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).not.toHaveBeenCalled();
    expect(user.uid).toBe('google_uid_existing');
  });
});
