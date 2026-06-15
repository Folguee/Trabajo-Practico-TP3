import { auth } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';

const RECEIPT_OCR_URL = process.env.EXPO_PUBLIC_RECEIPT_OCR_URL;
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;

export type OcrField<T> = {
  value: T | null;
  confidence: number;
};

export type ReceiptOcrResult = {
  title: OcrField<string>;
  amount: OcrField<number>;
  date: OcrField<string>;
  categoryHint: OcrField<string>;
  warnings: string[];
};

type AnalyzeReceiptOptions = {
  uri: string;
  mimeType?: string | null;
};

const requireOcrEndpoint = () => {
  if (!RECEIPT_OCR_URL) {
    throw new Error('Falta configurar EXPO_PUBLIC_RECEIPT_OCR_URL');
  }
  return RECEIPT_OCR_URL;
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

const inferMimeType = (uri: string) => {
  const normalized = uri.toLowerCase().split('?')[0];
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

export async function analyzeReceipt({
  uri,
  mimeType,
}: AnalyzeReceiptOptions): Promise<ReceiptOcrResult> {
  const endpoint = requireOcrEndpoint();
  const token = await getFirebaseToken();

  let targetUri = uri;
  let targetMimeType = mimeType || inferMimeType(uri);

  // Normalize WebP or other formats to JPEG before uploading for OCR analysis
  if (targetMimeType !== 'image/jpeg' && targetMimeType !== 'image/png') {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      targetUri = manipResult.uri;
      targetMimeType = 'image/jpeg';
    } catch (err) {
      console.warn('No se pudo normalizar la imagen a JPEG, se intentara enviar original:', err);
    }
  }

  const fileResponse = await fetch(targetUri);
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': targetMimeType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const body = await response.json();
  return body as ReceiptOcrResult;
}
