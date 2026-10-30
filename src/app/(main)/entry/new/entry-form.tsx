'use client'

import { useActionState, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { recordEntry } from '../../actions'
import { Field } from '@/components/action-form'
import { Notice } from '@/components/page'
import { localDate, money, qty } from '@/lib/format'
import type { Item, Person } from '@/lib/ledger'
import { cn } from '@/lib/utils'

type Kind = 'SELL' | 'ADD'

export function EntryForm({
  items,
  people,
  defaults,
}: {
  items: Item[]
  people: Person[]
  defaults: { type: Kind; itemId?: string; personId?: string }
}) {
  const [state, action, pending] = useActionState(recordEntry, null)
  const [type, setType] = useState<Kind>(defaults.type)
  const [itemId, setItemId] = useState(defaults.itemId ?? (items.length === 1 ? items[0].id : ''))
  const [personId, setPersonId] = useState(defaults.personId ?? '')
  const item = items.find((i) => i.id === itemId)
  const [price, setPrice] = useState(type === 'SELL' && item ? String(item.price) : '')
  const [quantity, setQuantity] = useState('')

  const out = type === 'SELL'
  const q = Number(quantity.replace(/,/g, '')) || 0
  const p = Number(price.replace(/,/g, '')) || 0
  const tooMany = out && item && q > item.stock

  function pickItem(id: string) {
    setItemId(id)
    const next = items.find((i) => i.id === id)
    if (out && next) setPrice(String(next.price))
  }

  function pickType(next: Kind) {
    setType(next)
    setPrice(next === 'SELL' && item ? String(item.price) : '')
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="type" value={type} />

      <div role="radiogroup" aria-label="Entry type" className="grid grid-cols-2 gap-1 rounded-lg border border-rule-strong bg-sheet p-1">
        {(
          [
            { k: 'SELL', label: 'Give out', icon: ArrowUpFromLine, on: 'bg-khata text-khata-ink' },
            { k: 'ADD', label: 'Add stock', icon: ArrowDownToLine, on: 'bg-green text-sheet' },
          ] as const
        ).map((o) => (
          <button
            key={o.k}
            type="button"
            role="radio"
            aria-checked={type === o.k}
            onClick={() => pickType(o.k)}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold text-ink-soft transition-colors',
              type === o.k ? o.on : 'hover:text-ink'
            )}
          >
            <o.icon className="size-4" /> {o.label}
          </button>
        ))}
      </div>

      {out && (
        <Field label="Who is taking it">
          <select
            name="person_id"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            required
            className="field"
          >
            <option value="" disabled>
              Pick a person
            </option>
            <option value="new">+ New person</option>
            {people.map((pp) => (
              <option key={pp.id} value={pp.id}>
                {pp.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {out && personId === 'new' && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-rule-strong p-3 sm:grid-cols-2">
          <Field label="Name">
            <input name="new_person_name" required autoFocus className="field" autoComplete="off" />
          </Field>
          <Field label="Phone (optional)">
            <input name="new_person_phone" type="tel" inputMode="tel" className="field" />
          </Field>
        </div>
      )}

      <Field label="Item">
        <select name="product_id" value={itemId} onChange={(e) => pickItem(e.target.value)} required className="field">
          <option value="" disabled>
            Pick an item
          </option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name.trim()} — {qty(i.stock)} {i.unit} left
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-[1.3fr_1fr] gap-3">
        <Field
          label={item ? `How many (${item.unit})` : 'How many'}
          hint={
            out && item ? (
              <span className={tooMany ? 'text-khata' : ''}>
                {tooMany ? `Only ${qty(item.stock)} left` : `${qty(item.stock)} in stock`}
              </span>
            ) : undefined
          }
        >
          <input
            name="quantity"
            required
            inputMode="numeric"
            pattern="[0-9,]*"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="field figure h-14 text-2xl"
            placeholder="0"
            aria-invalid={tooMany || undefined}
          />
        </Field>
        <Field label={out ? 'Price per unit' : 'You paid per unit'} hint={out ? undefined : 'Optional'}>
          <input
            name="unit_price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="field figure h-14 text-lg"
            placeholder="Rs"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input name="date" type="date" defaultValue={localDate()} max={localDate()} className="field" />
        </Field>
        <Field label="Note (optional)">
          <input name="notes" className="field" placeholder={out ? 'e.g. paid half' : 'e.g. from Madina'} autoComplete="off" />
        </Field>
      </div>

      <div className="ledger leader px-4 py-4 sm:px-5">
        <span className="text-ink-soft">{out ? 'Total value' : 'Total cost'}</span>
        <span className={cn('figure text-2xl font-semibold', !out && 'text-green')}>{money(q * p)}</span>
      </div>

      {state?.error && <Notice tone="error">{state.error}</Notice>}

      <button
        disabled={pending || !!tooMany}
        className={cn('w-full', out ? 'btn-primary' : 'btn-ink bg-green', 'h-12 text-base')}
      >
        {pending ? 'Saving…' : out ? 'Save — give out' : 'Save — add to stock'}
      </button>
    </form>
  )
}
