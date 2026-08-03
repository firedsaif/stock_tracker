'use server'

import { createClient } from '@/utils/supabase/server'
import { getUserRole } from '@/utils/roles'
import { revalidatePath } from 'next/cache'

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Members cannot delete transactions' }
  }

  const transactionId = formData.get('transaction_id') as string
  if (!transactionId) {
    return { error: 'Transaction ID is required' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', transactionId)

  if (error) {
    console.error('Error deleting transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/recycle-bin')
  return { success: true }
}

export async function restoreTransaction(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Members cannot restore transactions' }
  }

  const transactionId = formData.get('transaction_id') as string
  if (!transactionId) {
    return { error: 'Transaction ID is required' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: null })
    .eq('id', transactionId)

  if (error) {
    console.error('Error restoring transaction:', error)
    return { error: error.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/recycle-bin')
  return { success: true }
}

export async function hardDeleteTransaction(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Members cannot delete transactions' }
  }

  const transactionId = formData.get('transaction_id') as string
  if (!transactionId) {
    return { error: 'Transaction ID is required' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    console.error('Error deleting transaction permanently:', error)
    return { error: error.message }
  }

  revalidatePath('/recycle-bin')
  return { success: true }
}
