import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getItems } from '@/lib/queries'
import { isLow, stockValue } from '@/lib/ledger'
import { money, qty } from '@/lib/format'
import { qs } from '@/lib/period'
import { Empty, Notice, PageHeader } from '@/components/page'
import { AddItemButton, EditItemButton } from './item-forms'

export const metadata: Metadata = { title: 'Stock' }

export default async function StockPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const supabase = await createClient()
  const items = await getItems(supabase)
  const low = items.filter(isLow).length

  return (
    <div>
      <PageHeader
        title="Stock"
        eyebrow={`${items.length} items · worth ${money(stockValue(items))}`}
        actions={<AddItemButton />}
      />

      {saved && (
        <div className="mb-5 px-4 sm:px-0">
          <Notice>Stock added.</Notice>
        </div>
      )}

      {items.length === 0 ? (
        <Empty action={<AddItemButton label="Add your first item" />}>
          List what you keep in stock, with a price per unit.
        </Empty>
      ) : (
        <>
          {low > 0 && (
            <p className="mb-2 px-4 text-sm text-khata sm:px-0">
              {low} {low === 1 ? 'item is' : 'items are'} running low.
            </p>
          )}
          <ul className="ledger">
            {items.map((item) => {
              const lowNow = isLow(item)
              return (
                <li key={item.id} className="border-b border-rule px-4 py-4 last:border-0 sm:px-5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {item.category && <>{item.category} · </>}
                        <span className="figure">{money(item.price)}</span> per {item.unit.toLowerCase()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`figure text-xl leading-tight font-semibold ${lowNow ? 'text-khata' : ''}`}>
                        {qty(item.stock)}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {lowNow ? 'low · ' : ''}
                        {item.unit}
                      </p>
                    </div>
                    <EditItemButton item={item} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/entry/new${qs({ item: item.id })}`} className="btn-quiet btn-sm flex-1 sm:flex-none">
                      Give out
                    </Link>
                    <Link
                      href={`/entry/new${qs({ item: item.id, type: 'ADD' })}`}
                      className="btn-quiet btn-sm flex-1 text-green sm:flex-none"
                    >
                      Add stock
                    </Link>
                    <Link
                      href={`/history${qs({ item: item.id, range: 'all' })}`}
                      className="btn-sm ml-auto inline-flex items-center px-2 text-[0.8125rem] text-ink-soft hover:text-ink"
                    >
                      History
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
