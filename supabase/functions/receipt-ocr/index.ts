import {
  decodeProtectedHeader,
  importX509,
  jwtVerify,
} from "npm:jose@6";
import { parseOcrLines, OcrLine } from "./parser.ts";

const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/" +
  "securetoken@system.gserviceaccount.com";
const MAX_SIZE = 5 * 1024 * 1024;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: cors });

async function verifyFirebaseToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) throw new Error("Token requerido");

  const { kid, alg } = decodeProtectedHeader(token);
  if (!kid || alg !== "RS256") throw new Error("Token invalido");

  const response = await fetch(CERTS_URL);
  if (!response.ok) throw new Error("No se pudieron validar credenciales");

  const certs = await response.json();
  const certificate = certs[kid];
  if (!certificate) throw new Error("Firma desconocida");

  const key = await importX509(certificate, "RS256");
  const { payload } = await jwtVerify(token, key, {
    audience: PROJECT_ID,
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    algorithms: ["RS256"],
  });

  if (!payload.sub) throw new Error("Usuario invalido");
  return payload.sub;
}

// Safely convert ArrayBuffer to Base64 in chunks to avoid stack overflow
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 0xffff; // 64k chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any));
  }
  return btoa(chunks.join(""));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // 1. Verify Firebase Session
    await verifyFirebaseToken(req);

    if (req.method !== "POST") {
      return json({ error: "Metodo no permitido" }, 405);
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!["image/jpeg", "image/png", "application/pdf"].includes(contentType)) {
      return json({ error: "Formato no permitido. Solo se acepta JPEG, PNG y PDF" }, 415);
    }

    // 2. Read Binary Data
    const file = await req.arrayBuffer();
    if (!file.byteLength || file.byteLength > MAX_SIZE) {
      const isPdf = contentType === "application/pdf";
      return json({ error: isPdf ? "El archivo PDF debe pesar menos de 5 MB" : "La imagen debe pesar menos de 5 MB" }, 413);
    }

    // 3. Extract text lines
    let ocrLines: OcrLine[] = [];

    if (contentType === "application/pdf") {
      try {
        const { getDocumentProxy, extractText } = await import("npm:unpdf");
        const pdf = await getDocumentProxy(new Uint8Array(file));
        const { text } = await extractText(pdf, { mergePages: true });

        if (!text || !text.trim()) {
          return json({
            title: { value: null, confidence: 0.0 },
            amount: { value: null, confidence: 0.0 },
            date: { value: null, confidence: 0.0 },
            categoryHint: { value: null, confidence: 0.0 },
            warnings: ["El PDF seleccionado no contiene texto legible (puede ser una imagen escaneada)."]
          });
        }

        ocrLines = text
          .split("\n")
          .map((line: string) => ({
            text: line.trim(),
            confidence: 1.0,
          }))
          .filter((line) => line.text.length > 0);
      } catch (err: any) {
        console.error("Error procesando PDF:", err);
        return json({ error: "No se pudo procesar el archivo PDF" }, 422);
      }
    } else {
      // 3. Fetch Secret Keys
      const apiKey = Deno.env.get("NVIDIA_NEMOTRON_API_KEY");
      const ocrUrl = Deno.env.get("NVIDIA_NEMOTRON_OCR_URL");

      if (!apiKey || !ocrUrl) {
        console.error("Configuracion NVIDIA faltante");
        return json({ error: "Error de configuracion del servidor OCR" }, 500);
      }

      // 4. Convert to base64
      const base64Image = bufferToBase64(file);

      // 5. Send to NVIDIA OCR API with timeout (15s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch(ocrUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "accept": "application/json",
          },
          body: JSON.stringify({
            input: [
              {
                type: "image_url",
                url: `data:${contentType};base64,${base64Image}`,
              }
            ],
            merge_levels: ["paragraph"]
          }),
          signal: controller.signal
        });
      } catch (err: any) {
        if (err.name === "AbortError") {
          return json({ error: "Timeout en la conexion con el servidor OCR" }, 504);
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Error de NVIDIA: ${response.status} - ${responseText}`);
        if (response.status === 401) {
          return json({ error: "Error de autenticacion con el proveedor OCR" }, 500);
        }
        if (response.status === 429) {
          return json({ error: "Limite de solicitudes excedido con el proveedor OCR" }, 429);
        }
        return json({ error: "El proveedor OCR no pudo procesar la imagen" }, response.status);
      }

      const ocrData = await response.json();

      // 6. Extract raw text / confidence fields from NVIDIA OCR response
      if (Array.isArray(ocrData)) {
        ocrLines = ocrData.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: typeof d.confidence === "number" ? d.confidence : (typeof d.confidence_score === "number" ? d.confidence_score : 1.0)
        }));
      } else if (ocrData.data && Array.isArray(ocrData.data)) {
        ocrLines = ocrData.data.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: typeof d.confidence === "number" ? d.confidence : (typeof d.confidence_score === "number" ? d.confidence_score : 1.0)
        }));
      } else if (ocrData.predictions && Array.isArray(ocrData.predictions)) {
        ocrLines = ocrData.predictions.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: typeof d.confidence === "number" ? d.confidence : (typeof d.confidence_score === "number" ? d.confidence_score : 1.0)
        }));
      } else if (ocrData.detections && Array.isArray(ocrData.detections)) {
        ocrLines = ocrData.detections.map((d: any) => ({
          text: d.text || d.recognized_text || d.content || "",
          confidence: typeof d.confidence === "number" ? d.confidence : (typeof d.confidence_score === "number" ? d.confidence_score : 1.0)
        }));
      } else if (ocrData.choices?.[0]?.message?.content) {
        const content = ocrData.choices[0].message.content;
        ocrLines = content.split("\n").map((line: string) => ({
          text: line,
          confidence: 1.0
        }));
      } else {
        console.error("Payload NVIDIA no reconocido", JSON.stringify(ocrData));
        return json({ error: "Formato de respuesta del proveedor OCR no reconocido" }, 422);
      }
    }

    // 7. Parse and interpret results
    const parsedResult = parseOcrLines(ocrLines);

    return json(parsedResult);
  } catch (error) {
    console.error("Error en Edge Function receipt-ocr:", error);
    return json({ error: "No autorizado" }, 401);
  }
});
