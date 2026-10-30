'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(_: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  })

  if (error) {
    return {
      error: error.message === 'Invalid login credentials' ? 'That email and password don’t match.' : error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
