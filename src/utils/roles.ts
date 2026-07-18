import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type Role = 'SUPER_OWNER' | 'OWNER' | 'MEMBER' | null

export async function getUserRole(): Promise<{ role: Role, email: string | null, id: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { role: null, email: null, id: null }

  // Check explicit roles assigned in metadata
  if (user.user_metadata?.role === 'SUPER_OWNER') {
    return { role: 'SUPER_OWNER', email: user.email || null, id: user.id }
  }
  
  if (user.user_metadata?.role === 'OWNER') {
    return { role: 'OWNER', email: user.email || null, id: user.id }
  }

  // If no explicit role, check if they are the very first user (fallback for initial SUPER_OWNER)
  const adminAuthClient = createAdminClient()
  const { data: { users }, error } = await adminAuthClient.auth.admin.listUsers()
  
  if (!error && users && users.length > 0) {
    const sortedUsers = users.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const firstUser = sortedUsers[0]
    
    // If they are the first user and the first user doesn't have a role assigned yet, they are implicitly SUPER_OWNER
    if (user.id === firstUser.id && !firstUser.user_metadata?.role) {
      return { role: 'SUPER_OWNER', email: user.email || null, id: user.id }
    }
  }

  // Everyone else defaults to MEMBER
  return { role: 'MEMBER', email: user.email || null, id: user.id }
}
