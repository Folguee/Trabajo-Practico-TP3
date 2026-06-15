import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getDocumentProxy } from 'unpdf';
import { parseOcrLines } from '../../supabase/functions/receipt-ocr/parser';

const runLiveTest = process.env.RUN_LIVE_RECEIPT_TEST === 'true';
const liveDescribe = runLiveTest ? describe : describe.skip;

const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const receiptOcrUrl = process.env.EXPO_PUBLIC_RECEIPT_OCR_URL;

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

async function extractTextFromPdf(pdf: any): Promise<string> {
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let pageText = "";
    const items = textContent.items.filter((item: any) => typeof item.str === 'string');
    
    items.sort((a: any, b: any) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 3) {
        return yDiff;
      }
      return a.transform[4] - b.transform[4];
    });

    let lastY = -1;
    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== -1 && Math.abs(y - lastY) > 5) {
        pageText += "\n";
      } else if (pageText.length > 0 && !pageText.endsWith("\n") && !pageText.endsWith(" ")) {
        pageText += " ";
      }
      pageText += item.str;
      lastY = y;
    }
    fullText += pageText + "\n";
  }
  return fullText;
}

describe('Receipt Assets Parsing (Offline)', () => {
  const assetsDir = path.join(__dirname, '..', '..', 'tests', 'assets');
  const pdfPath = path.join(assetsDir, 'invoice-2000013400394520.pdf');

  it('debería leer y parsear correctamente el PDF real invoice-2000013400394520.pdf', async () => {
    expect(fs.existsSync(pdfPath)).toBe(true);

    const buffer = fs.readFileSync(pdfPath);
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const text = await extractTextFromPdf(pdf);

    expect(text).toBeDefined();
    expect(text.trim().length).toBeGreaterThan(0);

    const ocrLines = text
      .split('\n')
      .map(line => ({
        text: line.trim(),
        confidence: 1.0,
      }))
      .filter(line => line.text.length > 0);

    const result = parseOcrLines(ocrLines);

    console.log('Parsed PDF offline result:', JSON.stringify(result, null, 2));

    expect(result.title.value).toContain('WAINMANN ARIEL HERNAN');
    expect(result.date.value).toBe('18/02/2026');
    expect(result.amount.value).toBe(83989);
  });
});

liveDescribe('Receipt OCR - integración real con Supabase y NVIDIA', () => {
  let idToken: string;
  
  it('registra un usuario temporal para autenticar las llamadas', async () => {
    const unique = `${Date.now()}-${crypto.randomUUID()}`;
    const email = `receipt-ocr-test-${unique}@example.com`;
    const password = `Test-${crypto.randomUUID()}-A1`;
    const session = await firebaseRequest('signUp', {
      email,
      password,
      returnSecureToken: true,
    });
    idToken = session.idToken;
    expect(idToken).toBeDefined();
  });

  it('procesa el PDF real a través de la Edge Function receipt-ocr', async () => {
    const assetsDir = path.join(__dirname, '..', '..', 'tests', 'assets');
    const pdfPath = path.join(assetsDir, 'invoice-2000013400394520.pdf');
    const buffer = fs.readFileSync(pdfPath);

    const response = await fetch(receiptOcrUrl!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/pdf',
      },
      body: buffer,
    });

    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.title.value).toContain('WAINMANN ARIEL HERNAN');
    expect(result.date.value).toBe('18/02/2026');
    expect(result.amount.value).toBe(83989);
  });

  it('procesa la imagen de ejemplo a través de la Edge Function receipt-ocr', async () => {
    const assetsDir = path.join(__dirname, '..', '..', 'tests', 'assets');
    const imgPath = path.join(assetsDir, 'example_pdf.png');
    const buffer = fs.readFileSync(imgPath);

    const response = await fetch(receiptOcrUrl!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'image/png',
      },
      body: buffer,
    });

    const result = await response.json();
    
    if (response.status === 500 && result.error?.includes('configuracion')) {
      console.warn('\n⚠️ ATENCIÓN: Para que el test de la imagen pase en Supabase, debes configurar las variables de entorno de NVIDIA usando:');
      console.warn('supabase secrets set NVIDIA_NEMOTRON_API_KEY="..." NVIDIA_NEMOTRON_OCR_URL="..."\n');
      expect(response.status).toBe(200); // Esto forzará a que falle con un mensaje claro
    } else {
      expect(response.status).toBe(200);
      expect(result.amount.value).toBeGreaterThan(0);
      expect(result.date.value).toBeDefined();
    }
  });

  it('elimina el usuario temporal después de las pruebas', async () => {
    if (idToken) {
      await firebaseRequest('delete', { idToken }).catch(() => undefined);
    }
  });
});

describe('Receipt Image OCR (Local to NVIDIA)', () => {
  const assetsDir = path.join(__dirname, '..', '..', 'tests', 'assets');
  const imgPath = path.join(assetsDir, 'example_pdf.png');
  const apiKey = process.env.NVIDIA_NEMOTRON_API_KEY;
  const ocrUrl = process.env.NVIDIA_NEMOTRON_OCR_URL || 'https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v1';

  const hasApiKey = !!apiKey;
  const localOcrDescribe = hasApiKey ? describe : describe.skip;

  localOcrDescribe('Llamada directa a NVIDIA OCR', () => {
    it('debería subir la imagen a NVIDIA y parsear el comercio y monto', async () => {
      expect(fs.existsSync(imgPath)).toBe(true);

      const buffer = fs.readFileSync(imgPath);
      const base64Image = buffer.toString('base64');

      const response = await fetch(ocrUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          input: [
            {
              type: 'image_url',
              url: `data:image/png;base64,${base64Image}`,
            }
          ],
          merge_levels: ['paragraph']
        }),
      });

      expect(response.status).toBe(200);
      const ocrData = await response.json() as any;

      let ocrLines: any[] = [];
      const firstItem = Array.isArray(ocrData) ? ocrData[0] : ocrData;
      const data0 = firstItem?.data?.[0];
      const detections = data0?.text_detections || data0?.detections;
      if (data0 && Array.isArray(detections)) {
        ocrLines = detections.map((d: any) => ({
          text: d.text_prediction?.text || d.text || d.content || "",
          confidence: d.text_prediction?.confidence ?? d.confidence ?? 1.0
        }));
      } else if (Array.isArray(ocrData)) {
        ocrLines = ocrData.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: d.confidence ?? d.confidence_score ?? 1.0
        }));
      } else if (ocrData.data && Array.isArray(ocrData.data)) {
        ocrLines = ocrData.data.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: d.confidence ?? d.confidence_score ?? 1.0
        }));
      } else if (ocrData.predictions && Array.isArray(ocrData.predictions)) {
        ocrLines = ocrData.predictions.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: d.confidence ?? d.confidence_score ?? 1.0
        }));
      } else {
        throw new Error('Formato de respuesta NVIDIA desconocido: ' + JSON.stringify(ocrData));
      }

      console.log('NVIDIA Raw OCR Lines:', JSON.stringify(ocrLines, null, 2));
      const result = parseOcrLines(ocrLines);
      console.log('NVIDIA OCR parsed result:', JSON.stringify(result, null, 2));

      expect(result.title.value).toBeDefined();
      expect(result.amount.value).toBeGreaterThan(0);
    });
  });
});
