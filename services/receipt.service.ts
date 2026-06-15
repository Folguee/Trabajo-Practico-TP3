import { auth } from './firebase';

const RECEIPT_STORAGE_URL = process.env.EXPO_PUBLIC_RECEIPT_STORAGE_URL;
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;

type UploadReceiptOptions = {
  uri: string;
  mimeType?: string | null;
};

const requireEndpoint = () => {
  if (!RECEIPT_STORAGE_URL) {
    throw new Error('Falta configurar EXPO_PUBLIC_RECEIPT_STORAGE_URL');
  }

  return RECEIPT_STORAGE_URL;
};

const getFirebaseToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No hay un usuario autenticado');
  }

  return user.getIdToken();
};

const parseError = async (response: Response) => {
  try {
    const body = await response.json();
    return body?.error || `Error del servidor (${response.status})`;
  } catch {
    return `Error del servidor (${response.status})`;
  }
};

const request = async (path: string, init: RequestInit = {}) => {
  const endpoint = requireEndpoint();
  const token = await getFirebaseToken();
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response;
};

const inferMimeType = (uri: string) => {
  const normalized = uri.toLowerCase().split('?')[0];
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  if (normalized.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
};

export async function uploadReceipt({
  uri,
  mimeType,
}: UploadReceiptOptions): Promise<string> {
  const fileResponse = await fetch(uri);
  if (!fileResponse.ok) {
    throw new Error('No se pudo leer la imagen seleccionada');
  }

  const file = await fileResponse.arrayBuffer();
  if (!file.byteLength) {
    throw new Error('La imagen seleccionada esta vacia');
  }
  if (file.byteLength > MAX_RECEIPT_SIZE) {
    throw new Error('La imagen debe pesar menos de 5 MB');
  }

  const contentType = mimeType || fileResponse.headers.get('content-type') || inferMimeType(uri);
  const response = await request('', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  const body = await response.json();

  if (!body?.path) {
    throw new Error('El servidor no devolvio la ruta del comprobante');
  }

  return body.path;
}

export async function getReceiptSignedUrl(path: string): Promise<string> {
  const response = await request(`?path=${encodeURIComponent(path)}`);
  const body = await response.json();

  if (!body?.signedUrl) {
    throw new Error('El servidor no devolvio la URL del comprobante');
  }

  return body.signedUrl;
}

export async function deleteReceipt(path: string): Promise<void> {
  await request(`?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
}

export async function resolveReceiptUrl(
  imagePath?: string | null
): Promise<string | undefined> {
  if (!imagePath) return undefined;
  return getReceiptSignedUrl(imagePath);
}
