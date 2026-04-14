# Unified Theme Update for Librarian Page

This document outlines the standardized theme to be applied to all sections:
- Books (desk-books)
- Pending Accounts (desk-accounts) ✓ Already done
- Borrow Requests (desk-borrows)
- Renewal Requests (desk-renewals)
- Return Requests (desk-returns)
- Fine Payments (desk-fines)

## Unified Design Pattern

### Section Container
```tsx
<section className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[#091321]/95 shadow-2xl shadow-black/30">
  <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_62%)]" />
  <div className="relative p-5 md:p-6 lg:p-8">
```

### Header Section
```tsx
<div className="mb-8 rounded-[28px] border border-sky-300/15 bg-white/[0.04] p-6 shadow-[0_24px_80px_-52px_rgba(56,189,248,0.75)] md:p-7">
  <div className="flex items-start gap-4">
    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/18 text-sky-100 ring-1 ring-inset ring-sky-300/20">
      {/* Icon */}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-100/70">
        <span>Section Label</span>
        <span className="h-1 w-1 rounded-full bg-sky-300/70" />
        <span>Count</span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
        Section Title
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68 md:text-base">
        Description
      </p>
    </div>
  </div>
</div>
```

### Buttons
Primary: `rounded-2xl border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-50 transition hover:bg-sky-500/15`
Secondary: `rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15`

### Cards
```tsx
<div className="rounded-[28px] border border-white/12 bg-[#0f1b2f]/88 p-6 shadow-lg shadow-black/20">
```

### Stats Cards
```tsx
<div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
```
