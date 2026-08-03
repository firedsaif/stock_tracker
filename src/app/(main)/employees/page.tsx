import { createClient } from '@/utils/supabase/server'
import { EmployeesClient } from './employees-client'
import { getUserRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { role } = await getUserRole()

  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    redirect('/')
  }

  // Fetch employees
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading employees data.</div>
  }

  return <EmployeesClient employees={employees || []} userRole={role} />
}
