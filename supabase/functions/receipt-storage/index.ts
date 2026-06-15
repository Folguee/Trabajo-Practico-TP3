import { createClient } from "npm:@supabase/supabase-js@2";
import {
  decodeProtectedHeader,
  importX509,
  jwtVerify,
} from "npm:jose@6";

const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const BUCKET = "receipts";
const MAX_SIZE = 5 * 1024 * 1024;
const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/" +
  "securetoken@system.gserviceaccount.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const uid = await verifyFirebaseToken(req);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const url = new URL(req.url);

    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") ?? "";
      const extensions: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };
      const extension = extensions[contentType];

      if (!extension) return json({ error: "Formato no permitido" }, 415);

      const file = await req.arrayBuffer();
      if (!file.byteLength || file.byteLength > MAX_SIZE) {
        return json({ error: "La imagen debe pesar menos de 5 MB" }, 413);
      }

      const path = `${uid}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType, upsert: false });

      if (error) throw error;
      return json({ path }, 201);
    }

    const path = url.searchParams.get("path") ?? "";
    if (!path.startsWith(`${uid}/`)) {
      return json({ error: "Acceso denegado" }, 403);
    }

    if (req.method === "GET") {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600);

      if (error) throw error;
      return json({ signedUrl: data.signedUrl });
    }

    if (req.method === "DELETE") {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      return json({ deleted: true });
    }

    return json({ error: "Metodo no permitido" }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: "No autorizado" }, 401);
  }
});
