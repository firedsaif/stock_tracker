import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check if they were explicitly promoted to owner
  if (user.user_metadata?.is_admin === true) {
    return true
  }

  // Find the first user ever created in the system (Fallback for the main owner)
  const adminAuthClient = createAdminClient()
  const { data: { users }, error } = await adminAuthClient.auth.admin.listUsers()
  
  if (error || !users || users.length === 0) {
    return false
  }

  // Sort by created_at ascending to find the original owner
  const sortedUsers = users.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const owner = sortedUsers[0]

  return user.id === owner.id
}
