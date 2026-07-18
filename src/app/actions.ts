'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import { createAdminClient } from '@/utils/supabase/admin'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteMyAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const adminAuthClient = createAdminClient()
    await adminAuthClient.auth.admin.deleteUser(user.id)
    await supabase.auth.signOut()
  }
  
  redirect('/login')
}
