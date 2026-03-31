import { createClient } from "@supabase/supabase-js";

// ── Inline Supabase client (no @/lib imports needed) ─────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── Inline Google Sheets append (optional, only runs if ENABLE_SHEETS=true) ──
async function appendToSheet(submission) {
  if (process.env.ENABLE_SHEETS !== "true") return;
  try {
    const { google } = await import("googleapis");
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const submittedAt = new Date(submission.submitted_at).toLocaleString("en-IN");
    const rows = (submission.items || []).map((item) => [
      submittedAt,
      submission.invoice_no || "",
      submission.invoice_date || "",
      submission.vendor || "",
      item.item_name || "",
      item.manufacturer || "",
      item.qty ?? "",
      item.unit || "",
      item.rate ?? "",
      item.tax_pct != null ? `${Math.round(item.tax_pct * 100)}%` : "",
      item.tax_cost ?? "",
      item.total ?? "",
      item.scratched_out ? "Yes" : "No",
      item.modified ? "Yes" : "No",
      item.modification_note || "",
    ]);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Bills!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  } catch (err) {
    console.error("Google Sheets error:", err.message);
  }
}

// ── Build line items array ────────────────────────────────────────────────────
function buildLineItems(items, invoiceId) {
  return (items || []).map((item) => ({
    invoice_id:        invoiceId,
    item_name:         item.item_name || null,
    manufacturer:      item.manufacturer || null,
    qty:               item.qty != null ? parseFloat(item.qty) : null,
    unit:              item.unit || null,
    rate:              item.rate != null ? parseFloat(item.rate) : null,
    tax_pct:           item.tax_pct != null ? parseFloat(item.tax_pct) : null,
    tax_cost:          item.tax_cost != null ? parseFloat(item.tax_cost) : null,
    total:             item.total != null ? parseFloat(item.total) : null,
    scratched_out:     item.scratched_out || false,
    modified:          item.modified || false,
    modification_note: item.modification_note || null,
  }));
}

// ── POST: new submission with duplicate check ─────────────────────────────────
export async function POST(request) {
  try {
    const supabase = getSupabase();
    const submission = await request.json();
    const { invoice_no, invoice_date, vendor, items, invoice_total, submitted_by, payment_type } = submission;

    const normInvoice = (invoice_no || "").trim().toLowerCase();
    const normVendor  = (vendor || "").trim().toLowerCase();

    if (!normInvoice || !normVendor) {
      return Response.json(
        { error: "Invoice number and vendor name are required." },
        { status: 400 }
      );
    }

    // Duplicate check — return full existing record
    const { data: existing, error: dupErr } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .ilike("invoice_no", normInvoice)
      .ilike("vendor", `%${normVendor}%`)
      .limit(1)
      .maybeSingle();

    if (dupErr) throw new Error(`Duplicate check failed: ${dupErr.message}`);

    if (existing) {
      return Response.json(
        {
          duplicate: true,
          existing: {
            invoice_id:    existing.id,
            invoice_no:    existing.invoice_no,
            invoice_date:  existing.invoice_date,
            vendor:        existing.vendor,
            invoice_total: existing.invoice_total,
            payment_type:  existing.payment_type || "Credit",
            submitted_at:  existing.submitted_at,
            submitted_by:  existing.submitted_by || "app",
            items: (existing.invoice_items || []).map(i => ({
              id: i.id, item_name: i.item_name, manufacturer: i.manufacturer,
              qty: i.qty, unit: i.unit, rate: i.rate, tax_pct: i.tax_pct,
              tax_cost: i.tax_cost, total: i.total,
              scratched_out: i.scratched_out, modified: i.modified,
              modification_note: i.modification_note,
            })),
          },
        },
        { status: 409 }
      );
    }

    // Insert new invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        invoice_no:    invoice_no.trim(),
        invoice_date:  invoice_date || null,
        vendor:        vendor.trim(),
        invoice_total: invoice_total || null,
        payment_type:  payment_type || "Credit",
        submitted_by:  submitted_by || "app",
        submitted_at:  new Date().toISOString(),
      })
      .select()
      .single();

    if (invErr) throw new Error(`Invoice insert: ${invErr.message}`);

    const lineItems = buildLineItems(items, invoice.id);
    if (lineItems.length > 0) {
      const { error: itemErr } = await supabase.from("invoice_items").insert(lineItems);
      if (itemErr) throw new Error(`Items insert: ${itemErr.message}`);
    }

    await appendToSheet({ ...submission, submitted_at: invoice.submitted_at, items: lineItems });

    return Response.json({ success: true, invoice_id: invoice.id });

  } catch (err) {
    console.error("Submit error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT: update existing invoice ──────────────────────────────────────────────
export async function PUT(request) {
  try {
    const supabase = getSupabase();
    const submission = await request.json();
    const { invoice_id, invoice_no, invoice_date, vendor, items, invoice_total, submitted_by } = submission;

    if (!invoice_id) return Response.json({ error: "invoice_id required" }, { status: 400 });

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .update({
        invoice_no:    (invoice_no || "").trim(),
        invoice_date:  invoice_date || null,
        vendor:        (vendor || "").trim(),
        invoice_total: invoice_total || null,
        payment_type:  payment_type || "Credit",
        submitted_by:  submitted_by || "app",
        submitted_at:  new Date().toISOString(),
      })
      .eq("id", invoice_id)
      .select()
      .single();

    if (invErr) throw new Error(`Invoice update: ${invErr.message}`);

    // Delete old items and reinsert
    await supabase.from("invoice_items").delete().eq("invoice_id", invoice_id);

    const lineItems = buildLineItems(items, invoice_id);
    if (lineItems.length > 0) {
      const { error: itemErr } = await supabase.from("invoice_items").insert(lineItems);
      if (itemErr) throw new Error(`Items reinsert: ${itemErr.message}`);
    }

    await appendToSheet({ ...submission, submitted_at: invoice.submitted_at, items: lineItems });

    return Response.json({ success: true, invoice_id, updated: true });

  } catch (err) {
    console.error("Update error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── GET: fetch recent submissions ─────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .order("submitted_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
