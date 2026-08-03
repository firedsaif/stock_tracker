import { createClient } from '@/utils/supabase/server'
import { RecycleBinClient } from './recycle-bin-client'
import { getUserRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export default async function RecycleBinPage() {
  const supabase = await createClient()
  const { role } = await getUserRole()

  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    redirect('/')
  }

  // Fetch only deleted transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id,
      created_at,
      deleted_at,
      type,
      quantity,
      notes,
      sold_to,
      contact,
      unit_price,
      total_price,
      product_name,
      product_unit,
      user_email,
      products (
        name,
        unit
      )
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    return <div>Error loading recycle bin data.</div>
  }

  // @ts-ignore
  return <RecycleBinClient transactions={transactions || []} userRole={role} />
}
