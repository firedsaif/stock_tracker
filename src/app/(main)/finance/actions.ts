'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/utils/roles'

export async function addExpense(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { role } = await getUserRole()
  if (role === 'MEMBER') {
    return { error: 'Members cannot add expenses' }
  }

  const amount = parseFloat(formData.get('amount') as string)
  const reason = formData.get('reason') as string

  if (!amount || amount <= 0) {
    return { error: 'Amount must be greater than 0' }
  }
  if (!reason) {
    return { error: 'Reason is required' }
  }

  const { error: txError } = await supabase
    .from('expenses')
    .insert([{
      amount,
      reason,
      user_id: user.id,
      user_email: user.email
    }])

  if (txError) {
    console.error('Error adding expense:', txError)
    return { error: txError.message }
  }

  // Deduct from Company Balance
  const { data: balanceData } = await supabase
    .from('company_balance')
    .select('balance')
    .eq('id', 1)
    .single()
    
  if (balanceData) {
    await supabase
      .from('company_balance')
      .update({ 
        balance: balanceData.balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
  }

  revalidatePath('/finance')
  return { success: true }
}
