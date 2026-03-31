export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are an expert at reading vendor invoices/bills in India.

This file may contain one or more pages. Extract ALL line items from ALL pages.

You MUST return ONLY a valid JSON object. No markdown, no code fences, no explanation text.
Start your response with { and end with }

{
  "invoice_no": "invoice number as string",
  "invoice_date": "date as DD-Mon-YYYY e.g. 18-Oct-25",
  "vendor": "vendor/supplier name",
  "items": [
    {
      "item_name": "full item description",
      "manufacturer": "brand or empty string",
      "qty": 1,
      "unit": "PCS",
      "rate": 100.00,
      "tax_pct": 0.05,
      "total": 105.00,
      "scratched_out": false,
      "modified": false,
      "modification_note": ""
    }
  ],
  "invoice_total": 105.00
}

Rules:
- Use actual numbers for qty, rate, tax_pct, total — never strings, never null for numbers you can see
- If a value is truly missing use null
- tax_pct must be a decimal: 0.05 for 5%, 0.12 for 12%, 0.18 for 18%, 0 for exempt
- If a line item is crossed out set scratched_out to true
- If a value was handwritten over a printed one set modified to true
- Read ALL pages and include ALL items`;

function aggressiveClean(text) {
  // Step 1: Remove markdown fences
  text = text.replace(/^```json\s*/im, "");
  text = text.replace(/^```\s*/im, "");
  text = text.replace(/```\s*$/im, "");
  text = text.trim();

  // Step 2: Find the outermost { }
  const firstBrace = text.indexOf("{");
  const lastBrace  = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object found in response");
  text = text.slice(firstBrace, lastBrace + 1);

  // Step 3: Remove single-line comments
  text = text.replace(/\/\/[^\n\r"]*/g, "");

  // Step 4: Remove block comments
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");

  // Step 5: Remove trailing commas before ] or }
  text = text.replace(/,(\s*[}\]])/g, "$1");

  // Step 6: Fix unquoted keys (e.g. {key: "val"} → {"key": "val"})
  text = text.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

  // Step 7: Replace single-quoted strings with double-quoted
  text = text.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

  // Step 8: Remove any control characters
  text = text.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    // Keep newlines and tabs inside strings — remove others
    if (ch === "\n" || ch === "\r" || ch === "\t") return " ";
    return "";
  });

  // Step 9: Fix common number formatting issues — remove commas in numbers
  // e.g. "total": 1,500.00 → "total": 1500.00
  text = text.replace(/:(\s*)(\d{1,3})(,\d{3})+(\.\d+)?/g, (match, space, ...rest) => {
    return ":" + space + match.replace(/^:\s*/, "").replace(/,(\d{3})/g, "$1");
  });

  return text;
}

export async function POST(request) {
  try {
    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const isPdf = mediaType === "application/pdf";

    const body = {
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: isPdf ? "application/pdf" : (mediaType || "image/jpeg"), data: imageBase64 } },
          { text: "Extract all invoice details. Start your response immediately with { and end with }. No other text." },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    };

    const resp = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      let errMsg = `Gemini API ${resp.status}`;
      try {
        const e = await resp.json();
        errMsg += `: ${e.error?.message || JSON.stringify(e)}`;
      } catch {
        errMsg += `: ${await resp.text().catch(() => "Unknown error")}`;
      }
      throw new Error(errMsg);
    }

    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty response from Gemini — please try again");
    }

    // Try parsing with progressive cleanup
    let lastError;

    // Attempt 1: clean and parse
    try {
      const cleaned = aggressiveClean(rawText);
      const result = JSON.parse(cleaned);
      return Response.json(result);
    } catch (e) {
      lastError = e;
      console.error("Attempt 1 failed:", e.message);
    }

    // Attempt 2: try to salvage by truncating at last complete item
    try {
      let text = aggressiveClean(rawText);
      // Find the last complete item by looking for last },  or }] pattern
      const lastCompleteItem = text.lastIndexOf("},");
      const lastArrayClose   = text.lastIndexOf("}]");
      const cutPoint = Math.max(lastCompleteItem, lastArrayClose);
      if (cutPoint > 0) {
        // Close the array and object
        text = text.slice(0, cutPoint + 2) + "}";
        // Make sure items array is properly closed
        text = text.replace(/,\s*\}$/, "}");
        const result = JSON.parse(text);
        console.warn("Used salvage parsing — some items may be missing");
        return Response.json(result);
      }
    } catch (e) {
      console.error("Attempt 2 failed:", e.message);
    }

    // All attempts failed
    console.error("Raw Gemini response:", rawText.slice(0, 800));
    throw new Error(`Could not parse bill data — please try again or use a clearer photo.`);

  } catch (err) {
    console.error("Extract error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
