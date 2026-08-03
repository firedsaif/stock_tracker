import { createClient } from '@/utils/supabase/server'
import { AttendanceClient } from './attendance-client'
import { getUserRole } from '@/utils/roles'
import { redirect } from 'next/navigation'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const supabase = await createClient()
  const { role } = await getUserRole()

  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    redirect('/')
  }

  // Use today's date if none provided
  const targetDate = date || new Date().toISOString().split('T')[0]

  // Fetch employees
  const { data: employeesData, error: employeesError } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true })

  if (employeesError) {
    return <div>Error loading employees.</div>
  }

  // Fetch attendance records for the target date
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', targetDate)

  if (attendanceError) {
    return <div>Error loading attendance data.</div>
  }

  return (
    <AttendanceClient 
      employees={employeesData || []} 
      attendanceRecords={attendanceRecords || []} 
      currentDate={targetDate} 
    />
  )
}
