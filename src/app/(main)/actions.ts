'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { dayStart, isDateString, localDate } from '@/lib/format'

export type FormState = { error?: string; ok?: string } | null

function text(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim()
}

function num(fd: FormData, key: string): number | null {
  const raw = text(fd, key).replace(/,/g, '')
  if (raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

async function signedIn() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

function refreshAll() {
  revalidatePath('/', 'layout')
}

/** Postgres raise messages arrive as-is; keep them, drop driver noise. */
function dbMessage(message: string) {
  return message.replace(/^.*?ERROR:\s*/, '')
}

// Items ---------------------------------------------------------------------

export async function saveItem(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await signedIn()
  const id = text(fd, 'id')
  const name = text(fd, 'name')
  const unit = text(fd, 'unit') || 'Pieces'
  const price = num(fd, 'price')
  const low = num(fd, 'low_stock_limit')

  if (!name) return { error: 'Give the item a name.' }
  if (price === null || isNaN(price) || price < 0) return { error: 'Enter a price of 0 or more.' }
  if (low !== null && (isNaN(low) || low < 0)) return { error: 'Low stock alert must be 0 or more.' }

  const fields = {
    name,
    unit,
    price,
    category: text(fd, 'category') || null,
    low_stock_limit: Math.round(low ?? 0),
  }

  if (id) {
    const { error } = await supabase.from('products').update(fields).eq('id', id)
    if (error) return { error: error.message }
    refreshAll()
    return { ok: 'Item saved.' }
  }

  const opening = num(fd, 'opening_stock')
  if (opening !== null && (isNaN(opening) || opening < 0 || !Number.isInteger(opening))) {
    return { error: 'Opening stock must be a whole number.' }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...fields, stock: 0, user_id: user.id, user_email: user.email })
    .select('id')
    .single()
  if (error) return { error: error.message }

  if (opening) {
    const cost = num(fd, 'opening_cost')
    const { error: moveError } = await supabase.rpc('record_movement', {
      p_product_id: data.id,
      p_type: 'ADD',
      p_quantity: opening,
      p_unit_price: cost && !isNaN(cost) ? cost : null,
      p_notes: 'Opening stock',
    })
    if (moveError) return { error: `Item added, but opening stock failed: ${dbMessage(moveError.message)}` }
  }

  refreshAll()
  return { ok: 'Item added.' }
}

export async function deleteItem(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await signedIn()
  const { error } = await supabase.from('products').delete().eq('id', text(fd, 'id'))
  if (error) return { error: error.message }
  refreshAll()
  redirect('/stock')
}

// Entries -------------------------------------------------------------------

export async function recordEntry(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await signedIn()
  const type = text(fd, 'type') === 'ADD' ? 'ADD' : 'SELL'
  const productId = text(fd, 'product_id')
  const quantity = num(fd, 'quantity')
  const price = num(fd, 'unit_price')
  const date = text(fd, 'date')
  let personId = text(fd, 'person_id')

  if (!productId) return { error: 'Pick an item.' }
  if (!quantity || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return { error: 'Quantity must be a whole number above 0.' }
  }
  if (price !== null && (isNaN(price) || price < 0)) return { error: 'Price must be 0 or more.' }
  if (date && !isDateString(date)) return { error: 'Pick a valid date.' }
  if (date && date > localDate()) return { error: 'The date cannot be in the future.' }

  if (type === 'SELL') {
    if (personId === 'new') {
      const name = text(fd, 'new_person_name')
      if (!name) return { error: 'Type the new person’s name.' }
      const { data, error } = await supabase
        .from('people')
        .insert({ name, phone: text(fd, 'new_person_phone') || null })
        .select('id')
        .single()
      if (error) return { error: error.message }
      personId = data.id
    }
    if (!personId) return { error: 'Pick who is taking it.' }
  }

  // Back-dated entries are stamped at local noon so they sort inside that day.
  const createdAt = date && date !== localDate() ? new Date(dayStart(date).getTime() + 12 * 3_600_000) : null

  const { error } = await supabase.rpc('record_movement', {
    p_product_id: productId,
    p_type: type,
    p_quantity: quantity,
    p_unit_price: price,
    p_person_id: type === 'SELL' ? personId : null,
    p_notes: text(fd, 'notes') || null,
    p_created_at: createdAt?.toISOString() ?? null,
  })
  if (error) return { error: dbMessage(error.message) }

  refreshAll()
  redirect(type === 'SELL' ? `/people/${personId}?saved=1` : `/stock?saved=1`)
}

export async function deleteEntry(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await signedIn()
  const { error } = await supabase.rpc('delete_movement', { p_id: text(fd, 'id') })
  if (error) return { error: dbMessage(error.message) }
  refreshAll()
  return { ok: 'Entry removed and stock put back.' }
}

// People --------------------------------------------------------------------

export async function savePerson(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await signedIn()
  const id = text(fd, 'id')
  const fields = {
    name: text(fd, 'name'),
    phone: text(fd, 'phone') || null,
    notes: text(fd, 'notes') || null,
  }
  if (!fields.name) return { error: 'Type a name.' }

  if (id) {
    const { error } = await supabase.from('people').update(fields).eq('id', id)
    if (error) return { error: error.message }
    // Keep the name printed on their past entries in step.
    await supabase.from('transactions').update({ sold_to: fields.name }).eq('person_id', id)
    refreshAll()
    return { ok: 'Saved.' }
  }

  const { data, error } = await supabase.from('people').insert(fields).select('id').single()
  if (error) return { error: error.message }
  refreshAll()
  redirect(`/people/${data.id}`)
}

export async function deletePerson(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await signedIn()
  const { error } = await supabase.from('people').delete().eq('id', text(fd, 'id'))
  if (error) return { error: error.message }
  refreshAll()
  redirect('/people')
}

export async function mergePerson(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await signedIn()
  const from = text(fd, 'id')
  const into = text(fd, 'into')
  if (!into) return { error: 'Pick who to merge into.' }
  const { error } = await supabase.rpc('merge_people', { p_from: from, p_into: into })
  if (error) return { error: dbMessage(error.message) }
  refreshAll()
  redirect(`/people/${into}`)
}

// Session -------------------------------------------------------------------

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
