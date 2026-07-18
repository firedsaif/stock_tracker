import { createClient } from '@/utils/supabase/server'
import { InventoryClient } from './inventory-client'
import { getUserRole } from '@/utils/roles'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { role } = await getUserRole()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return <div>Error loading inventory data.</div>
  }

  return <InventoryClient initialProducts={products || []} userRole={role} />
}
