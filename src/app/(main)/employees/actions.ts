'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/utils/roles'

export async function addEmployee(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { role } = await getUserRole()
  if (role === 'MEMBER') {
    return { error: 'Members cannot add employees' }
  }

  const name = formData.get('name') as string
  const cnic = formData.get('cnic') as string

  if (!name || !cnic) {
    return { error: 'Name and CNIC are required' }
  }

  const { error } = await supabase
    .from('employees')
    .insert([{
      name,
      cnic,
      created_by: user.id
    }])

  if (error) {
    console.error('Error adding employee:', error)
    if (error.code === '23505') {
      return { error: 'An employee with this CNIC already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/employees')
  revalidatePath('/attendance')
  return { success: true }
}

export async function removeEmployee(formData: FormData) {
  const supabase = await createClient()
  
  const { role } = await getUserRole()
  if (role === 'MEMBER') {
    return { error: 'Members cannot remove employees' }
  }

  const employeeId = formData.get('employee_id') as string

  if (!employeeId) {
    return { error: 'Employee ID is required' }
  }

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId)

  if (error) {
    console.error('Error removing employee:', error)
    return { error: error.message }
  }

  revalidatePath('/employees')
  revalidatePath('/attendance')
  return { success: true }
}
