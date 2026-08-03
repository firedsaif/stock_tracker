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

  const userId = formData.get('user_id') as string
  const userEmail = formData.get('user_email') as string
  const status = formData.get('status') as 'PRESENT' | 'ABSENT' | 'LEAVE'
  const date = formData.get('date') as string // YYYY-MM-DD format

  if (!userId || !userEmail || !status || !date) {
    return { error: 'Missing required fields' }
  }

  // Upsert attendance record for the date
  const { error } = await supabase
    .from('attendance')
    .upsert({
      user_id: userId,
      user_email: userEmail,
      date: date,
      status: status,
      marked_by: user.id
    }, {
      onConflict: 'user_id,date'
    })

  if (error) {
    console.error('Error marking attendance:', error)
    return { error: error.message }
  }

  revalidatePath('/attendance')
  return { success: true }
}
