import { afterAll, describe, expect, it } from 'vitest';

const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const receiptStorageUrl = process.env.EXPO_PUBLIC_RECEIPT_STORAGE_URL;
const runLiveTest = process.env.RUN_LIVE_RECEIPT_TEST === 'true';
const liveDescribe = runLiveTest ? describe : describe.skip;

type FirebaseSession = {
  idToken: string;
  localId: string;
};

let session: FirebaseSession | null = null;
let uploadedPath: string | null = null;

const firebaseRequest = async (action: string, body: Record<string, unknown>) => {
  if (!firebaseApiKey) throw new Error('Falta EXPO_PUBLIC_FIREBASE_API_KEY');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || `Firebase respondio ${response.status}`);
  }

  return result;
};

const receiptRequest = async (
  path: string,
  token: string,
  init: RequestInit = {}
) => {
  if (!receiptStorageUrl) {
    throw new Error('Falta EXPO_PUBLIC_RECEIPT_STORAGE_URL');
  }

  return fetch(`${receiptStorageUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
};

liveDescribe('Receipt Storage - integración real', () => {
  afterAll(async () => {
    if (session && uploadedPath) {
      await receiptRequest(
        `?path=${encodeURIComponent(uploadedPath)}`,
        session.idToken,
        { method: 'DELETE' }
      ).catch(() => undefined);
    }

    if (session) {
      await firebaseRequest('delete', { idToken: session.idToken }).catch(
        () => undefined
      );
    }
  });

  it('sube, firma, descarga y elimina un comprobante', async () => {
    const unique = `${Date.now()}-${crypto.randomUUID()}`;
    const email = `receipt-test-${unique}@example.com`;
    const password = `Test-${crypto.randomUUID()}-A1`;
    session = await firebaseRequest('signUp', {
      email,
      password,
      returnSecureToken: true,
    });

    const imageBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      0x49, 0x46, 0x00, 0x01, 0xff, 0xd9,
    ]);
    const uploadResponse = await receiptRequest('', session.idToken, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: imageBytes,
    });
    const uploadBody = await uploadResponse.json();

    expect(uploadResponse.status, JSON.stringify(uploadBody)).toBe(201);
    expect(uploadBody.path).toMatch(
      new RegExp(`^${session.localId}/[\\w-]+\\.jpg$`)
    );
    uploadedPath = uploadBody.path;

    const signedResponse = await receiptRequest(
      `?path=${encodeURIComponent(uploadedPath)}`,
      session.idToken
    );
    const signedBody = await signedResponse.json();

    expect(signedResponse.status, JSON.stringify(signedBody)).toBe(200);
    expect(signedBody.signedUrl).toMatch(/^https:\/\//);

    const downloadResponse = await fetch(signedBody.signedUrl);
    expect(downloadResponse.status).toBe(200);
    expect((await downloadResponse.arrayBuffer()).byteLength).toBeGreaterThan(0);

    const deleteResponse = await receiptRequest(
      `?path=${encodeURIComponent(uploadedPath)}`,
      session.idToken,
      { method: 'DELETE' }
    );
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status, JSON.stringify(deleteBody)).toBe(200);
    expect(deleteBody).toEqual({ deleted: true });
    uploadedPath = null;
  }, 30_000);
});
