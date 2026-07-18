import { createClient } from '@/utils/supabase/server'
import { TransactionsClient } from './transactions-client'
import { getUserRole } from '@/utils/roles'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { role } = await getUserRole()

  // Fetch transactions with joined product data
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id,
      created_at,
      type,
      quantity,
      notes,
      sold_to,
      contact,
      unit_price,
      total_price,
      product_name,
      product_unit,
      products (
        name,
        unit
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading transactions data.</div>
  }

  // @ts-ignore
  return <TransactionsClient transactions={transactions || []} userRole={role} />
}
