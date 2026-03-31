# BillCapture — Deployment Guide

A mobile-first app for your purchase team to photograph vendor bills, review AI-extracted fields, and submit directly to a database + Google Sheets.

---

## Architecture

```
Phone Camera / Upload
       ↓
  Next.js App (Vercel)  ← free hosting
       ↓
  /api/extract  →  Google Gemini 2.0 Flash  ← FREE (1,500 scans/day)
  /api/submit   →  Supabase DB              ← free up to 500MB
                →  Google Sheets            ← optional, free
```

Your Gemini API key stays server-side only — never exposed to the browser.

---

## Step 1 — Get your Gemini API key (2 minutes, free, no credit card)

1. Go to https://aistudio.google.com
2. Click "Get API key" then "Create API key"
3. Copy the key (starts with AIza...)
4. Done. Free tier = 1,500 bill scans per day.

---

## Step 2 — Supabase Database (free)

1. Go to https://supabase.com → New project (free tier)
2. Database → SQL Editor → New query → paste and run supabase_schema.sql
3. Project Settings → API → copy:
   - Project URL         → NEXT_PUBLIC_SUPABASE_URL
   - anon public key     → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key    → SUPABASE_SERVICE_ROLE_KEY (keep secret)

---

## Step 3 — Google Sheets sync (optional)

Skip if you only want Supabase.

Create a Google Sheet, rename first tab to "Bills", copy the Sheet ID from the URL.

For the service account:
1. console.cloud.google.com → enable Google Sheets API
2. IAM & Admin → Service Accounts → Create → download JSON key
3. Share your Google Sheet with the service account email (Editor)
4. Paste the entire JSON as one line into GOOGLE_SERVICE_ACCOUNT_JSON

---

## Step 4 — Deploy to Vercel (free)

Push to GitHub:
  git init && git add . && git commit -m "Initial commit"
  git remote add origin https://github.com/YOUR_USERNAME/bill-capture.git
  git push -u origin main

Import to Vercel:
1. vercel.com → Add New Project → import your repo → Deploy
2. Settings → Environment Variables → add:

  GEMINI_API_KEY                  (from aistudio.google.com)
  NEXT_PUBLIC_SUPABASE_URL        (Supabase Project Settings)
  NEXT_PUBLIC_SUPABASE_ANON_KEY   (Supabase Project Settings)
  SUPABASE_SERVICE_ROLE_KEY       (Supabase Project Settings)
  ENABLE_SHEETS                   true or false
  GOOGLE_SHEET_ID                 from your sheet URL
  GOOGLE_SERVICE_ACCOUNT_JSON     the downloaded JSON as one line

3. Deployments → Redeploy → your app is live!

Share the URL with your team.
On iPhone: Safari → Share → Add to Home Screen
On Android: Chrome → menu → Add to Home Screen

---

## What is Missing — Things to Build Next

This is a working MVP. Here is what you will want to add as you grow:

HIGH PRIORITY

1. Team member login
   Right now anyone with the URL can submit. Add Supabase Auth (email or Google
   login) so you know who submitted each bill. Each submission records the user email.
   Estimated effort: 1 day

2. Duplicate invoice detection
   Nothing stops someone scanning the same bill twice. Add a check in /api/submit:
   query invoices where invoice_no matches before inserting.
   Estimated effort: 2 hours

3. Bill image storage
   The photo is processed but never saved. Store it in Supabase Storage so you
   have the original scan for audit purposes.
   Estimated effort: half a day

4. Admin dashboard
   Your accounts team needs a web view to see all bills, filter by vendor and date,
   and export. Currently they have to look at Supabase or Google Sheets directly.
   Build a /admin page with a table, filters, and CSV/Excel export.
   Estimated effort: 2-3 days

MEDIUM PRIORITY

5. Offline support and retry
   If the phone loses signal mid-submission the bill is lost. Save a draft to
   localStorage and retry automatically when the connection restores.

6. Multi-page PDF handling
   Gemini processes one image at a time. For multi-page invoices you need to split
   the PDF into pages and merge the extracted results.

7. Vendor master list
   AI extraction may produce slightly different vendor names across bills.
   Add a dropdown so team members select the canonical vendor name.

8. Approval workflow for large bills
   For bills above a threshold (e.g. Rs 50,000) route to a manager for approval
   before the bill is marked final in the database.

NICE TO HAVE

9. WhatsApp or email notifications
   Notify the finance lead when a bill is submitted. Resend.com is free for low volume.

10. Match against Purchase Orders
    If you raise POs before receiving goods, auto-match incoming bills against
    open POs and flag any discrepancies in quantity or price.

11. Export to accounting software
    Add an export button formatted for Tally, Zoho Books, or QuickBooks.

---

## Local development

  cd bill-capture
  npm install
  cp .env.example .env.local
  # Fill in .env.local with your real keys
  npm run dev
  # Open http://localhost:3000

---

## Project structure

  bill-capture/
  +-- app/
  |   +-- layout.jsx              HTML shell
  |   +-- page.jsx                Mobile capture/review UI
  |   +-- api/
  |       +-- extract/route.js    POST: Gemini proxy (server-side key)
  |       +-- submit/route.js     POST: save to Supabase + Sheets
  |                               GET:  fetch recent submissions
  +-- lib/
  |   +-- supabase.js             Supabase clients
  |   +-- sheets.js               Google Sheets sync
  +-- supabase_schema.sql         Run once in Supabase SQL editor
  +-- .env.example                Copy to .env.local for local dev
  +-- next.config.js
  +-- package.json
