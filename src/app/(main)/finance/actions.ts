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

export async function setInitialBalance(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Members cannot update balance' }
  }

  const newBalance = parseFloat(formData.get('balance') as string)
  if (isNaN(newBalance)) {
    return { error: 'Invalid balance amount' }
  }

  const { error } = await supabase
    .from('company_balance')
    .update({ 
      balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)

  if (error) {
    console.error('Error setting balance:', error)
    return { error: error.message }
  }

  revalidatePath('/finance')
  return { success: true }
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Members cannot delete expenses' }
  }

  const expenseId = formData.get('expense_id') as string
  if (!expenseId) {
    return { error: 'Expense ID required' }
  }

  // Fetch the expense to get its amount so we can restore the balance
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('id', expenseId)
    .single()

  if (fetchError || !expense) {
    return { error: 'Expense not found' }
  }

  // Delete the expense
  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (deleteError) {
    console.error('Error deleting expense:', deleteError)
    return { error: deleteError.message }
  }

  // Restore the balance
  const { data: balanceData } = await supabase
    .from('company_balance')
    .select('balance')
    .eq('id', 1)
    .single()
    
  if (balanceData) {
    await supabase
      .from('company_balance')
      .update({ 
        balance: balanceData.balance + expense.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
  }

  revalidatePath('/finance')
  return { success: true }
}
