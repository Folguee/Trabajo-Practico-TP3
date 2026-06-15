import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseOcrLines } from '../../supabase/functions/receipt-ocr/parser';


const getIdToken = vi.fn();
const manipulateAsync = vi.fn();

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken,
    },
  },
}));

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync,
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

describe('Receipt OCR Service & Parser', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env.EXPO_PUBLIC_RECEIPT_OCR_URL =
      'https://example.supabase.co/functions/v1/receipt-ocr';
  });

  describe('Client receipt-ocr.service', () => {
    it('envia imagen y retorna ReceiptOcrResult con token firebase', async () => {
      getIdToken.mockResolvedValue('firebase-id-token');
      const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
      const mockOcrResult = {
        title: { value: 'COTO', confidence: 0.9 },
        amount: { value: 1250.5, confidence: 0.85 },
        date: { value: '15/06/2026', confidence: 0.95 },
        categoryHint: { value: 'Alimentacion', confidence: 0.8 },
        warnings: [],
      };

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(imageBytes, {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        )
        .mockResolvedValueOnce(
          Response.json(mockOcrResult, { status: 200 })
        );
      vi.stubGlobal('fetch', fetchMock);

      const { analyzeReceipt } = await import('../receipt-ocr.service');
      const result = await analyzeReceipt({ uri: 'file:///coto_ticket.jpg' });

      expect(result).toEqual(mockOcrResult);
      expect(getIdToken).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenNthCalledWith(1, 'file:///coto_ticket.jpg');
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://example.supabase.co/functions/v1/receipt-ocr',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer firebase-id-token',
            'Content-Type': 'image/jpeg',
          },
          body: imageBytes,
        })
      );
    });

    it('normaliza imagenes WebP a JPEG usando expo-image-manipulator antes de enviar', async () => {
      getIdToken.mockResolvedValue('firebase-id-token');
      const imageBytes = new Uint8Array([5, 6, 7, 8]).buffer;
      manipulateAsync.mockResolvedValue({ uri: 'file:///normalized.jpg' });

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(imageBytes, {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        )
        .mockResolvedValueOnce(
          Response.json({ title: { value: 'Dia', confidence: 0.9 } }, { status: 200 })
        );
      vi.stubGlobal('fetch', fetchMock);

      const { analyzeReceipt } = await import('../receipt-ocr.service');
      await analyzeReceipt({ uri: 'file:///ticket.webp', mimeType: 'image/webp' });

      expect(manipulateAsync).toHaveBeenCalledWith(
        'file:///ticket.webp',
        [],
        { format: 'jpeg' }
      );
      expect(fetchMock).toHaveBeenNthCalledWith(1, 'file:///normalized.jpg');
    });

    it('no normaliza documentos PDF a JPEG y los envia como application/pdf', async () => {
      getIdToken.mockResolvedValue('firebase-id-token');
      const pdfBytes = new Uint8Array([37, 80, 68, 70]).buffer;

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(pdfBytes, {
            status: 200,
            headers: { 'Content-Type': 'application/pdf' },
          })
        )
        .mockResolvedValueOnce(
          Response.json({ title: { value: 'Metrogas', confidence: 1.0 } }, { status: 200 })
        );
      vi.stubGlobal('fetch', fetchMock);

      const { analyzeReceipt } = await import('../receipt-ocr.service');
      const result = await analyzeReceipt({ uri: 'file:///comprobante.pdf', mimeType: 'application/pdf' });

      expect(manipulateAsync).not.toHaveBeenCalled();
      expect(result.title.value).toBe('Metrogas');
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://example.supabase.co/functions/v1/receipt-ocr',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer firebase-id-token',
            'Content-Type': 'application/pdf',
          },
          body: pdfBytes,
        })
      );
    });
  });

  describe('Pure OCR Parser (parseOcrLines)', () => {
    it('extrae comercio, monto, fecha y categoria de COTO correctamente', () => {
      const ocrLines = [
        { text: 'COTO C.I.C.S.A.', confidence: 0.99 },
        { text: 'Av. Cabildo 545, CABA', confidence: 0.95 },
        { text: 'CUIT: 30-54808315-3', confidence: 0.99 },
        { text: 'FECHA: 12/06/2026  HORA: 18:32', confidence: 0.98 },
        { text: '1   COCA COLA 2.25L         $1500,00', confidence: 0.90 },
        { text: '2   PAN LACTAL INTEGRAL     $2200,00', confidence: 0.91 },
        { text: 'SUBTOTAL                   $3700,00', confidence: 0.95 },
        { text: 'IVA 21%                     $777,00', confidence: 0.92 },
        { text: 'TOTAL A PAGAR AR$          $3700,00', confidence: 0.99 },
        { text: 'PAGO EFECTIVO              $4000,00', confidence: 0.94 },
        { text: 'VUELTO                      $300,00', confidence: 0.93 },
      ];

      const result = parseOcrLines(ocrLines);

      expect(result.title.value).toBe('COTO C.I.C.S.A.');
      expect(result.date.value).toBe('12/06/2026');
      expect(result.amount.value).toBe(3700);
      expect(result.categoryHint.value).toBe('Alimentacion');
      expect(result.warnings).toHaveLength(0);
    });

    it('extrae comprobante de transporte (YPF) y asigna Transporte', () => {
      const ocrLines = [
        { text: 'ESTACION DE SERVICIO YPF', confidence: 0.98 },
        { text: 'Ruta 9 Km 280', confidence: 0.90 },
        { text: 'EMISION: 10-06-26', confidence: 0.95 },
        { text: 'INFINIA DIESEL   50.2 L', confidence: 0.92 },
        { text: 'IMPORTE TOTAL: $ 62.400,50', confidence: 0.99 },
        { text: 'TARJETA DEBITO', confidence: 0.90 },
      ];

      const result = parseOcrLines(ocrLines);

      expect(result.title.value).toBe('ESTACION DE SERVICIO YPF');
      expect(result.date.value).toBe('10/06/2026');
      expect(result.amount.value).toBe(62400.5);
      expect(result.categoryHint.value).toBe('Transporte');
    });

    it('maneja importes con puntos de miles y comas decimales argentinos', () => {
      const ocrLines = [
        { text: 'EASY HOME CENTER', confidence: 0.97 },
        { text: 'FECHA: 01/06/2026', confidence: 0.95 },
        { text: 'TOTAL: 154.320,00', confidence: 0.99 },
      ];

      const result = parseOcrLines(ocrLines);

      expect(result.amount.value).toBe(154320);
      expect(result.categoryHint.value).toBe('Hogar');
    });

    it('maneja importes con comas de miles y puntos decimales (formato US)', () => {
      const ocrLines = [
        { text: 'SERVICIO DE INTERNET', confidence: 0.97 },
        { text: 'FECHA: 01/06/2026', confidence: 0.95 },
        { text: 'TOTAL: 149,999.01', confidence: 0.99 },
      ];

      const result = parseOcrLines(ocrLines);

      expect(result.amount.value).toBe(149999.01);
    });

    it('no sugiere fecha si esta en el futuro', () => {
      const futureYear = new Date().getFullYear() + 2;
      const ocrLines = [
        { text: 'Farmacity 44', confidence: 0.98 },
        { text: `Fecha: 15/06/${futureYear}`, confidence: 0.99 },
        { text: 'TOTAL: $500.00', confidence: 0.99 },
      ];

      const result = parseOcrLines(ocrLines);

      expect(result.date.value).toBeNull();
      expect(result.warnings).toContain('No se pudo determinar la fecha del comprobante.');
    });

    it('simula la lectura de un PDF digital de Carrefour y extrae campos correctos', () => {
      const pdfExtractedText = `
        INC S.A.
        CARREFOUR EXPRESS
        Sucursal 123 - Av. Corrientes 2500
        C.U.I.T.: 30-68731043-4
        IVA RESPONSABLE INSCRIPTO
        FECHA: 14/06/2026  HORA: 12:45:00
        Nro. Factura: 0005-00129481
        -------------------------------
        PROD1          $450,00
        PROD2         $1.200,00
        -------------------------------
        SUBTOTAL      $1.650,00
        TOTAL:        $1.650,00
        EFECTIVO      $2.000,00
        VUELTO         $350,00
      `;

      const ocrLines = pdfExtractedText
        .split('\n')
        .map(line => ({ text: line.trim(), confidence: 1.0 }))
        .filter(line => line.text.length > 0);

      const result = parseOcrLines(ocrLines);

      expect(result.title.value).toBe('INC S.A.');
      expect(result.date.value).toBe('14/06/2026');
      expect(result.amount.value).toBe(1650);
      expect(result.categoryHint.value).toBe('Alimentacion');
      expect(result.warnings).toHaveLength(0);
    });

    it('simula la lectura de un PDF digital de Edenor y extrae campos correctos', () => {
      const pdfExtractedText = `
        EDENOR S.A.
        Factura de Servicio Electrico
        Cliente: Juan Perez
        Vencimiento: 25/06/2026
        Fecha de Emision: 05/06/2026
        Detalle de consumo bimestral
        TOTAL A PAGAR: $18.450,20
        Luz y Fuerza para el Hogar
      `;

      const ocrLines = pdfExtractedText
        .split('\n')
        .map(line => ({ text: line.trim(), confidence: 1.0 }))
        .filter(line => line.text.length > 0);

      const result = parseOcrLines(ocrLines);

      expect(result.title.value).toBe('EDENOR S.A.');
      expect(result.date.value).toBe('05/06/2026');
      expect(result.amount.value).toBe(18450.2);
      expect(result.categoryHint.value).toBe('Servicios');
    });

    it('devuelve warnings para campos de baja confianza o no encontrados', () => {
      const ocrLines = [
        { text: 'FACTURA TICKET NOISE', confidence: 0.5 },
      ];

      const result = parseOcrLines(ocrLines);

      expect(result.title.value).toBeNull();
      expect(result.amount.value).toBeNull();
      expect(result.date.value).toBeNull();
      expect(result.categoryHint.value).toBeNull();
      expect(result.warnings).toContain('No se pudo determinar el comercio con alta confianza.');
      expect(result.warnings).toContain('No se pudo determinar la fecha del comprobante.');
      expect(result.warnings).toContain('No se pudo determinar el monto total con alta confianza.');
      expect(result.warnings).toContain('No se pudo sugerir una categoría.');
    });
  });
});
