'use client'

import { Merge, Pencil, Trash2, UserPlus } from 'lucide-react'
import { deletePerson, mergePerson, savePerson } from '../actions'
import { ActionForm, Field } from '@/components/action-form'
import { Sheet } from '@/components/sheet'
import type { Person } from '@/lib/ledger'

function PersonFields({ person }: { person?: Person }) {
  return (
    <div className="space-y-4">
      <Field label="Name">
        <input name="name" required defaultValue={person?.name} className="field" autoComplete="off" placeholder="e.g. Noman" />
      </Field>
      <Field label="Phone (optional)">
        <input name="phone" type="tel" inputMode="tel" defaultValue={person?.phone ?? ''} className="field" placeholder="0300 1234567" />
      </Field>
      <Field label="Note (optional)">
        <input name="notes" defaultValue={person?.notes ?? ''} className="field" placeholder="Shop, area, anything to remember" />
      </Field>
    </div>
  )
}

export function AddPersonButton() {
  return (
    <Sheet
      title="Add person"
      triggerClassName="btn-quiet btn-sm"
      trigger={
        <>
          <UserPlus className="size-4" /> Add
        </>
      }
    >
      {() => (
        <ActionForm action={savePerson}>
          {(pending) => (
            <>
              <PersonFields />
              <button disabled={pending} className="btn-ink mt-6 w-full">
                {pending ? 'Adding…' : 'Add person'}
              </button>
            </>
          )}
        </ActionForm>
      )}
    </Sheet>
  )
}

export function PersonMenu({ person, others, entryCount }: { person: Person; others: Person[]; entryCount: number }) {
  return (
    <div className="flex gap-2">
      <Sheet
        title="Edit person"
        triggerLabel="Edit person"
        triggerClassName="btn-quiet btn-sm px-2.5"
        trigger={<Pencil className="size-4" />}
      >
        {(close) => (
          <div className="space-y-8">
            <ActionForm action={savePerson} hidden={{ id: person.id }} onDone={close}>
              {(pending) => (
                <>
                  <PersonFields person={person} />
                  <button disabled={pending} className="btn-ink mt-6 w-full">
                    {pending ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </ActionForm>

            {others.length > 0 && (
              <ActionForm
                action={mergePerson}
                hidden={{ id: person.id }}
                confirm={`Move all of ${person.name}'s entries to the person you picked, and remove ${person.name}?`}
                className="border-t border-rule pt-6"
              >
                {(pending) => (
                  <>
                    <p className="mb-1 flex items-center gap-2 font-medium">
                      <Merge className="size-4" /> Same person, typed twice?
                    </p>
                    <p className="mb-3 text-sm text-ink-soft">
                      Move {person.name}&rsquo;s {entryCount} {entryCount === 1 ? 'entry' : 'entries'} into another name.
                    </p>
                    <div className="flex gap-2">
                      <select name="into" required defaultValue="" className="field">
                        <option value="" disabled>
                          Merge into…
                        </option>
                        {others.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <button disabled={pending} className="btn-quiet shrink-0">
                        Merge
                      </button>
                    </div>
                  </>
                )}
              </ActionForm>
            )}

            <ActionForm
              action={deletePerson}
              hidden={{ id: person.id }}
              confirm={
                entryCount > 0
                  ? `Remove ${person.name}? Their ${entryCount} entries stay in the history under their name.`
                  : `Remove ${person.name}?`
              }
              className="border-t border-rule pt-6"
            >
              {(pending) => (
                <button disabled={pending} className="btn-danger w-full">
                  <Trash2 className="size-4" /> Remove {person.name}
                </button>
              )}
            </ActionForm>
          </div>
        )}
      </Sheet>
    </div>
  )
}
