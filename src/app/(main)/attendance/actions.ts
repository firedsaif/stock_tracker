'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/utils/roles'

export async function markAttendance(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { role } = await getUserRole()
  if (role === 'MEMBER') {
    return { error: 'Members cannot mark attendance' }
  }

  const employeeId = formData.get('employee_id') as string
  const status = formData.get('status') as 'PRESENT' | 'ABSENT' | 'LEAVE'
  const date = formData.get('date') as string // YYYY-MM-DD format

  if (!employeeId || !status || !date) {
    return { error: 'Missing required fields' }
  }

  // Upsert attendance record for the date
  const { error } = await supabase
    .from('attendance')
    .upsert({
      employee_id: employeeId,
      date: date,
      status: status,
      marked_by: user.id
    }, {
      onConflict: 'employee_id,date'
    })

  if (error) {
    console.error('Error marking attendance:', error)
    return { error: error.message }
  }

  revalidatePath('/attendance')
  return { success: true }
}
