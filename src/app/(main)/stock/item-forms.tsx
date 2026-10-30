'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteItem, saveItem } from '../actions'
import { ActionForm, Field } from '@/components/action-form'
import { Sheet } from '@/components/sheet'
import type { Item } from '@/lib/ledger'

function ItemFields({ item }: { item?: Item }) {
  return (
    <div className="space-y-4">
      <Field label="Item name">
        <input name="name" required defaultValue={item?.name} className="field" placeholder="e.g. White stone" autoComplete="off" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Counted in">
          <input name="unit" defaultValue={item?.unit ?? 'Pieces'} className="field" placeholder="Pieces" />
        </Field>
        <Field label="Price per unit (Rs)">
          <input
            name="price"
            required
            inputMode="decimal"
            defaultValue={item?.price ?? ''}
            className="field figure"
            placeholder="0"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Group (optional)">
          <input name="category" defaultValue={item?.category ?? ''} className="field" placeholder="e.g. Stones" />
        </Field>
        <Field label="Warn me below">
          <input
            name="low_stock_limit"
            inputMode="numeric"
            defaultValue={item?.low_stock_limit ?? 20}
            className="field figure"
          />
        </Field>
      </div>
    </div>
  )
}

export function AddItemButton({ label = 'Add item' }: { label?: string }) {
  return (
    <Sheet
      title="Add item"
      triggerClassName="btn-quiet btn-sm"
      trigger={
        <>
          <Plus className="size-4" /> {label}
        </>
      }
    >
      {(close) => (
        <ActionForm action={saveItem} onDone={close}>
          {(pending) => (
            <>
              <ItemFields />
              <fieldset className="mt-6 border-t border-rule pt-5">
                <legend className="eyebrow mb-3 pt-5">Stock you have right now</legend>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quantity">
                    <input name="opening_stock" inputMode="numeric" className="field figure" placeholder="0" />
                  </Field>
                  <Field label="You paid per unit" hint="Optional">
                    <input name="opening_cost" inputMode="decimal" className="field figure" placeholder="Rs" />
                  </Field>
                </div>
              </fieldset>
              <button disabled={pending} className="btn-ink mt-6 w-full">
                {pending ? 'Adding…' : 'Add item'}
              </button>
            </>
          )}
        </ActionForm>
      )}
    </Sheet>
  )
}

export function EditItemButton({ item }: { item: Item }) {
  return (
    <Sheet
      title={`Edit ${item.name.trim()}`}
      triggerLabel={`Edit ${item.name}`}
      triggerClassName="rounded-md p-2 text-ink-faint hover:bg-paper hover:text-ink"
      trigger={<Pencil className="size-4" />}
    >
      {(close) => (
        <div className="space-y-6">
          <ActionForm action={saveItem} hidden={{ id: item.id }} onDone={close}>
            {(pending) => (
              <>
                <ItemFields item={item} />
                <p className="mt-4 text-xs text-ink-faint">
                  To change how many you have, use New entry → Add stock or Give out. That keeps the history right.
                </p>
                <button disabled={pending} className="btn-ink mt-5 w-full">
                  {pending ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
          </ActionForm>
          <ActionForm
            action={deleteItem}
            hidden={{ id: item.id }}
            confirm={`Remove ${item.name.trim()}? Past entries stay in everyone's history.`}
            className="border-t border-rule pt-6"
          >
            {(pending) => (
              <button disabled={pending} className="btn-danger w-full">
                <Trash2 className="size-4" /> Remove item
              </button>
            )}
          </ActionForm>
        </div>
      )}
    </Sheet>
  )
}
