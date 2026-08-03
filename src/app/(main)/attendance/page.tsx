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

  // We need a list of all users to mark attendance.
  // We can fetch from auth.users if super owner, but team members can be fetched securely using an RPC or getting all profiles.
  // Wait, Supabase auth.users is admin-only. We don't have a public users table.
  // Let's use the Supabase admin client to fetch all users like we do in Team page.
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
  if (usersError) {
    return <div>Error loading users.</div>
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
      users={usersData.users || []} 
      attendanceRecords={attendanceRecords || []} 
      currentDate={targetDate} 
    />
  )
}
