import Link from 'next/link'
import { type Entry, entryValue } from '@/lib/ledger'
import { formatTime, marginDate, money, qty } from '@/lib/format'
import { DeleteEntryButton } from './delete-entry'

export function EntryRow({
  entry: e,
  personName,
  itemName,
  showPerson = true,
  linkPerson = true,
}: {
  entry: Entry
  personName: string
  itemName: string
  showPerson?: boolean
  linkPerson?: boolean
}) {
  const out = e.type === 'SELL'
  const value = entryValue(e)
  const { day, month } = marginDate(e.created_at)
  const unit = e.product_unit ?? ''
  const rate = out ? e.unit_price : e.unit_cost

  const headline = out ? (showPerson ? personName : itemName) : 'Stock added'

  return (
    <li className="ledger-row">
      <div className="ledger-margin">
        <span className="block text-[0.95rem] font-medium text-ink-soft">{day}</span>
        {month}
      </div>
      <div className="ledger-body flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-medium">
              {out && showPerson && linkPerson && e.person_id ? (
                <Link href={`/people/${e.person_id}`} className="hover:underline">
                  {headline}
                </Link>
              ) : (
                headline
              )}
            </p>
            <p className={`figure shrink-0 text-[0.95rem] ${out ? 'text-ink' : 'text-green'}`}>
              {value > 0 ? money(value) : '—'}
            </p>
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-ink-soft">
            <span className={`figure ${out ? '' : 'text-green'}`}>
              {out ? '−' : '+'}
              {qty(e.quantity)}
            </span>{' '}
            {unit}
            {(out ? showPerson : true) && <> · {itemName}</>}
            {rate ? <> · <span className="figure">@ {qty(Number(rate))}</span></> : null}
            <span className="text-ink-faint"> · {formatTime(e.created_at)}</span>
          </p>
          {e.notes && <p className="mt-1 text-[0.8125rem] text-ink-faint italic">{e.notes}</p>}
        </div>
        <DeleteEntryButton id={e.id} />
      </div>
    </li>
  )
}
