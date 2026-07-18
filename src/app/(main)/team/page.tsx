import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamClient } from './team-client'
import { createAdminClient } from '@/utils/supabase/admin'
import { getUserRole } from '@/utils/roles'
import { redirect } from 'next/navigation'
import { removeMember, promoteToOwner, demoteToMember, transferSuperOwner } from './actions'
import { Button } from '@/components/ui/button'

export default async function TeamPage() {
  const { role: currentUserRole, id: currentUserId } = await getUserRole()
  if (currentUserRole !== 'SUPER_OWNER' && currentUserRole !== 'OWNER') {
    redirect('/')
  }

  const adminAuthClient = createAdminClient()
  const { data: { users }, error } = await adminAuthClient.auth.admin.listUsers()

  const sortedUsers = (users || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const activeUsers = sortedUsers.map((u, index) => {
    let resolvedRole = u.user_metadata?.role || 'MEMBER'
    if (index === 0 && !u.user_metadata?.role) {
      resolvedRole = 'SUPER_OWNER'
    }

    return {
      id: u.id,
      email: u.email || 'No email',
      last_sign_in: u.last_sign_in_at || 'Never',
      created_at: u.created_at,
      role: resolvedRole
    }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <TeamClient />
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Members</CardTitle>
              <CardDescription>People who have access to the system</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-y">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Email</th>
                      <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Joined</th>
                      <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Last Login</th>
                      <th className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user) => {
                      const isMe = user.id === currentUserId
                      
                      return (
                        <tr key={user.id} className="bg-white border-b">
                          <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {user.email} 
                            {user.role === 'SUPER_OWNER' && <span className="ml-2 inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">Super Owner</span>}
                            {user.role === 'OWNER' && <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">Owner</span>}
                            {user.role === 'MEMBER' && <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Member</span>}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap">
                            {user.last_sign_in !== 'Never' ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                            {!isMe && (
                              <div className="flex justify-end gap-2">
                                {currentUserRole === 'SUPER_OWNER' && (
                                  <>
                                    {user.role === 'MEMBER' && (
                                      <form action={async (formData) => { 'use server'; await promoteToOwner(formData) }}>
                                        <input type="hidden" name="userId" value={user.id} />
                                        <Button type="submit" variant="outline" size="sm" className="h-8">
                                          Make Owner
                                        </Button>
                                      </form>
                                    )}
                                    {user.role === 'OWNER' && (
                                      <>
                                        <form action={async (formData) => { 'use server'; await demoteToMember(formData) }}>
                                          <input type="hidden" name="userId" value={user.id} />
                                          <Button type="submit" variant="outline" size="sm" className="h-8">
                                            Make Member
                                          </Button>
                                        </form>
                                        <form action={async (formData) => { 'use server'; await transferSuperOwner(formData) }}>
                                          <input type="hidden" name="userId" value={user.id} />
                                          <Button type="submit" variant="outline" size="sm" className="h-8 border-purple-200 text-purple-700 hover:bg-purple-50">
                                            Transfer Super Owner
                                          </Button>
                                        </form>
                                      </>
                                    )}
                                    <form action={async (formData) => { 'use server'; await removeMember(formData) }}>
                                      <input type="hidden" name="userId" value={user.id} />
                                      <input type="hidden" name="targetRole" value={user.role} />
                                      <Button type="submit" variant="destructive" size="sm" className="h-8">
                                        Remove
                                      </Button>
                                    </form>
                                  </>
                                )}
                                
                                {currentUserRole === 'OWNER' && user.role === 'MEMBER' && (
                                  <form action={async (formData) => { 'use server'; await removeMember(formData) }}>
                                    <input type="hidden" name="userId" value={user.id} />
                                    <input type="hidden" name="targetRole" value={user.role} />
                                    <Button type="submit" variant="destructive" size="sm" className="h-8">
                                      Remove
                                    </Button>
                                  </form>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {activeUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No active members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
