-- Run this in your Supabase SQL editor (Database → SQL Editor → New query)

-- ── Invoices table ──────────────────────────────────────────────────────────
create table if not exists invoices (
  id             bigint        generated always as identity primary key,
  invoice_no     text,
  invoice_date   text,
  vendor         text,
  invoice_total  numeric,
  grand_total    numeric,
  submitted_by   text          default 'app',
  submitted_at   timestamptz   default now()
);

-- ── Line items table ─────────────────────────────────────────────────────────
create table if not exists invoice_items (
  id                bigint    generated always as identity primary key,
  invoice_id        bigint    references invoices(id) on delete cascade,
  item_name         text,
  manufacturer      text,
  qty               numeric,
  unit              text,
  rate              numeric,
  tax_pct           numeric,
  tax_cost          numeric,
  total             numeric,
  scratched_out     boolean   default false,
  modified          boolean   default false,
  modification_note text,
  created_at        timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_invoices_submitted_at on invoices(submitted_at desc);
create index if not exists idx_items_invoice_id on invoice_items(invoice_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- The API uses the service role key server-side so RLS doesn't block it.
-- Enable RLS to lock down direct client access.
alter table invoices      enable row level security;
alter table invoice_items enable row level security;

-- Allow server (service role) full access — no policy needed for service role.
-- Optionally add a policy to let authenticated users read their own submissions:
-- create policy "Users can read invoices" on invoices for select using (auth.role() = 'authenticated');

-- ── Duplicate prevention: unique constraint on invoice_no + vendor ────────────
-- Normalise to lowercase so "ABC" and "abc" are treated as the same
-- This is a safety net on top of the app-level check in /api/submit

-- Step 1: Add normalised columns
alter table invoices
  add column if not exists invoice_no_norm text generated always as (lower(trim(invoice_no))) stored,
  add column if not exists vendor_norm     text generated always as (lower(trim(vendor)))     stored;

-- Step 2: Unique index on the normalised pair
create unique index if not exists uq_invoice_no_vendor
  on invoices (invoice_no_norm, vendor_norm);

-- NOTE: If you already have data in the table and there are existing duplicates,
-- this index creation will fail. Clean them up first:
--   delete from invoices where id not in (
--     select min(id) from invoices group by lower(trim(invoice_no)), lower(trim(vendor))
--   );

-- ── Add payment_type column (run this if you already have the table) ──────────
alter table invoices
  add column if not exists payment_type text default 'Credit';
