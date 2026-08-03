import { createClient } from '@/utils/supabase/server'
import { FinanceClient } from './finance-client'
import { getUserRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export default async function FinancePage() {
  const supabase = await createClient()
  const { role } = await getUserRole()

  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    redirect('/')
  }

  // Fetch Company Balance
  const { data: balanceData } = await supabase
    .from('company_balance')
    .select('balance')
    .eq('id', 1)
    .single()

  // Fetch Expenses
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch recent stock transactions that affected balance (for a unified ledger if needed, but for now we can just show expenses)
  const balance = balanceData?.balance || 0

  if (expensesError) {
    return <div>Error loading finance data.</div>
  }

  return <FinanceClient balance={balance} expenses={expenses || []} userRole={role} />
}
