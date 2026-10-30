# Stock Khata

A stock ledger for one person: keep a list of items, record stock coming in and
going out, and see who took what, month by month.

- **This month**: totals given out, who took the most, items moved, latest entries
- **People**: one page per person with all-time total, month-by-month breakdown and every entry
- **Stock**: items, price per unit, how many are left, low-stock warnings
- **All entries**: filter by period, person or item; printable

Built with Next.js 16 (App Router, server actions) and Supabase (auth + Postgres).

## Setup

1. Create `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

2. Run `supabase/migrations/20261030_single_owner_ledger.sql` once in the Supabase SQL editor.
   It adds the `people` table and the `record_movement`, `delete_movement` and `merge_people`
   functions that keep stock counts correct.
3. Create the login in Supabase → Authentication → Users, and turn off public sign-ups.
4. `npm install && npm run dev`

Dates are grouped by Pakistan time (`Asia/Karachi`), set in `src/lib/format.ts`.
