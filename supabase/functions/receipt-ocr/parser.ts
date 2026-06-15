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

export interface OcrLine {
  text: string;
  confidence: number;
}

function cleanAmountString(amountStr: string): string {
  let cleaned = amountStr.replace(/[^0-9.,]/g, "").trim();
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    const dotIndex = cleaned.indexOf(".");
    const commaIndex = cleaned.indexOf(",");
    if (dotIndex < commaIndex) {
      cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = cleaned.split(",");
    if (parts[1].length === 3) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = parts[0] + "." + parts[1];
    }
  } else if (hasDot) {
    const parts = cleaned.split(".");
    if (parts[1].length === 3) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }
  return cleaned;
}

export function parseOcrLines(lines: OcrLine[]): ReceiptOcrResult {
  const result: ReceiptOcrResult = {
    title: { value: null, confidence: 0.0 },
    amount: { value: null, confidence: 0.0 },
    date: { value: null, confidence: 0.0 },
    categoryHint: { value: null, confidence: 0.0 },
    warnings: []
  };

  if (!lines || lines.length === 0) {
    result.warnings.push("No se detectó ningún texto en el comprobante.");
    return result;
  }

  const cleanLines = lines
    .map(line => ({
      text: line.text.trim(),
      confidence: typeof line.confidence === "number" ? line.confidence : 1.0
    }))
    .filter(line => line.text.length > 0);

  // 1. Merchant Title Extraction
  const cuitRegex = /cuit|c\.u\.i\.t\.|2[0370]-\d{8}-\d|\b\d{11}\b/i;
  const addressRegex = /av\.|calle|ruta|nro|piso|caba|provincia|buenos aires|tel|telefono|cel|@|\.com|\.ar/i;
  const headerNoiseRegex = /^(?:factura|ticket|comprobante|duplicado|original|monotributo|resp\.|inscripto|consumidor|final|a\s+pagar|efectivo|debito|tarjeta)\b/i;
  const datePatternRegex = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/;
  const numberNoiseRegex = /^\s*[\d.,$-]+\s*$/;

  for (let i = 0; i < Math.min(6, cleanLines.length); i++) {
    const line = cleanLines[i];
    const text = line.text;
    if (
      !cuitRegex.test(text) &&
      !addressRegex.test(text) &&
      !headerNoiseRegex.test(text) &&
      !datePatternRegex.test(text) &&
      !numberNoiseRegex.test(text) &&
      text.length > 2
    ) {
      const posConfidence = i <= 1 ? 0.9 : (i <= 3 ? 0.75 : 0.6);
      result.title = {
        value: text,
        confidence: Number((line.confidence * posConfidence).toFixed(2))
      };
      break;
    }
  }

  if (!result.title.value) {
    result.warnings.push("No se pudo determinar el comercio con alta confianza.");
  }

  // 2. Date Extraction
  const dateRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/;
  let bestDate: { value: string; confidence: number } | null = null;

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const match = line.text.match(dateRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      let yearStr = match[3];
      let year = parseInt(yearStr, 10);
      if (yearStr.length === 2) {
        year += 2000;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
        const dateObj = new Date(year, month - 1, day);
        if (
          dateObj.getFullYear() === year &&
          dateObj.getMonth() === month - 1 &&
          dateObj.getDate() === day
        ) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (dateObj <= today) {
            const formattedDay = day.toString().padStart(2, "0");
            const formattedMonth = month.toString().padStart(2, "0");
            const dateStr = `${formattedDay}/${formattedMonth}/${year}`;

            let baseConf = 0.8;
            if (/fecha|emision|f\./i.test(line.text)) {
              baseConf = 0.95;
            }
            const conf = Number((line.confidence * baseConf).toFixed(2));

            if (!bestDate || conf > bestDate.confidence) {
              bestDate = { value: dateStr, confidence: conf };
            }
          }
        }
      }
    }
  }

  if (bestDate) {
    result.date = bestDate;
  } else {
    result.warnings.push("No se pudo determinar la fecha del comprobante.");
  }

  // 3. Amount Extraction
  const amountRegex = /(?:\$|ARS|USD)?\s*(?:[1-9]\d{0,2}(?:\.\d{3})*(?:,\d{2})|[1-9]\d*(?:,\d{2})|[1-9]\d*(?:\.\d{2})|\d+(?:[.,]\d{2}))/g;
  
  interface CandidateAmount {
    value: number;
    score: number;
    confidence: number;
  }
  const candidates: CandidateAmount[] = [];

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const text = line.text;
    const matches = text.matchAll(amountRegex);

    for (const match of matches) {
      const matchStr = match[0];
      const cleaned = cleanAmountString(matchStr);
      const val = parseFloat(cleaned);

      if (!isNaN(val) && val > 0 && val < 5000000) {
        if (val >= 2000 && val <= 2030 && (text.includes("/") || text.includes("-"))) {
          continue;
        }

        let score = 0;
        const lowerLine = text.toLowerCase();
        
        const totalKeywords = ["total", "total a pagar", "importe total", "total pagado", "neto a pagar", "pago total", "total ar", "total ar$", "monto total", "importa", "importe"];
        const penaltyKeywords = ["subtotal", "sub-total", "neto gravado", "iva", "duplicado", "vuelto", "cambio", "descuento", "bonificacion", "recargo", "cuit", "telefono", "tel", "nro", "c.u.i.t."];

        const isTotalKeyword = totalKeywords.some(k => lowerLine.includes(k));
        const isPenaltyKeyword = penaltyKeywords.some(k => lowerLine.includes(k));

        if (isTotalKeyword) {
          score += 100;
          if (/\btotal\b/i.test(text)) score += 30;
        }
        if (isPenaltyKeyword) {
          score -= 150;
        }

        if (i > 0) {
          const prevLine = cleanLines[i - 1].text.toLowerCase();
          if (totalKeywords.some(k => prevLine.includes(k))) score += 40;
          if (penaltyKeywords.some(k => prevLine.includes(k))) score -= 40;
        }
        if (i < cleanLines.length - 1) {
          const nextLine = cleanLines[i + 1].text.toLowerCase();
          if (totalKeywords.some(k => nextLine.includes(k))) score += 40;
          if (penaltyKeywords.some(k => nextLine.includes(k))) score -= 40;
        }

        const relativePosition = i / cleanLines.length;
        if (relativePosition > 0.6) {
          score += 20;
        } else if (relativePosition < 0.25) {
          score -= 30;
        }

        let baseConf = 0.5;
        if (score >= 80) baseConf = 0.9;
        else if (score >= 20) baseConf = 0.75;
        else if (score >= -30) baseConf = 0.6;
        else baseConf = 0.3;

        const conf = Number((line.confidence * baseConf).toFixed(2));
        candidates.push({ value: val, score, confidence: conf });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const bestAmount = candidates[0];
    result.amount = {
      value: bestAmount.value,
      confidence: bestAmount.confidence
    };
  } else {
    result.warnings.push("No se pudo determinar el monto total con alta confianza.");
  }

  // 4. Category Hint Extraction
  const categoryKeywords: Record<string, string[]> = {
    Alimentacion: [
      "coto", "carrefour", "jumbo", "disco", "vea", "dia%", "changomas", "supermercado",
      "almacen", "despensa", "panaderia", "carniceria", "verduleria", "kiosco", "minimarket",
      "rotiseria", "burger", "mcdonald", "mostaza", "restaurant", "pizza", "heladeria", "cafe",
      "alimentos", "comida", "gaseosa", "rotiseria", "fiambreria", "express", "chango", "mercado",
      "pan", "facturas", "carne", "verdura", "fruta", "coca", "pepsi", "agua", "cerveza"
    ],
    Transporte: [
      "ypf", "shell", "axion", "puma", "combustible", "nafta", "gasoil", "peaje", "uber",
      "cabify", "didi", "taxi", "subte", "tren", "colectivo", "sube", "estacionamiento",
      "garage", "pasaje", "peajes", "remis", "estacion de servicio", "combustibles"
    ],
    Hogar: [
      "easy", "sodimac", "blaisten", "muebles", "ferreteria", "pintureria", "blanqueria",
      "bazar", "electrodomesticos", "colchon", "limpieza", "hogar", "decoracion", "ferre",
      "pintura", "foco", "lampara", "cables"
    ],
    Servicios: [
      "edesur", "edenor", "metrogas", "aysa", "telecom", "fibertel", "cablevision", "personal",
      "movistar", "claro", "telecentro", "netflix", "spotify", "expensas", "abl", "luz",
      "gas", "agua", "telefono", "internet", "seguros", "patente", "cooperativa", "tv",
      "factura de", "servicio", "vencimiento"
    ],
    Salud: [
      "farmacity", "simplicity", "farmacia", "clinica", "hospital", "sanatorio", "osde",
      "swiss", "galeno", "medicamento", "consulta", "odontologo", "optica", "remedio",
      "drogueria", "pediatra", "oftalmologo", "remedios", "farmacias", "obrasocial"
    ],
    Ocio: [
      "cine", "teatro", "recital", "concierto", "boliche", "cerveceria", "bar", "pub",
      "club", "gimnasio", "playstation", "steam", "xbox", "entrada", "show", "bowling",
      "shopping", "entretenimiento", "juegos", "evento", "cerveza", "trago", "boliche"
    ]
  };

  const fullTextLower = cleanLines.map(l => l.text).join(" ").toLowerCase();
  const categoryScores: { category: string; score: number }[] = [];

  for (const [catName, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedKeyword}\\b|${escapedKeyword}`, "g");
      const matches = fullTextLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      categoryScores.push({ category: catName, score });
    }
  }

  categoryScores.sort((a, b) => b.score - a.score);

  if (categoryScores.length > 0) {
    const bestCat = categoryScores[0];
    let conf = 0.5;
    if (bestCat.score >= 3) conf = 0.9;
    else if (bestCat.score === 2) conf = 0.8;
    else if (bestCat.score === 1) conf = 0.7;

    result.categoryHint = {
      value: bestCat.category,
      confidence: conf
    };
  } else {
    result.warnings.push("No se pudo sugerir una categoría.");
  }

  return result;
}
