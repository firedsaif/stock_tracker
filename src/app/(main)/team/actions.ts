'use server'

import { getUserRole } from '@/utils/roles'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function inviteMember(formData: FormData) {
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Unauthorized. Only an owner can add members.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const adminAuthClient = createAdminClient()

  const { data, error } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'MEMBER' }
  })

  if (error) {
    console.error('Error creating member:', error)
    return { error: error.message }
  }

  revalidatePath('/team')
  return { success: true }
}

export async function removeMember(formData: FormData) {
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER' && role !== 'OWNER') {
    return { error: 'Unauthorized.' }
  }

  const userId = formData.get('userId') as string
  const targetRole = formData.get('targetRole') as string
  
  if (!userId) return { error: 'User ID required' }

  if (role === 'OWNER' && targetRole !== 'MEMBER') {
    return { error: 'Owners can only remove Members.' }
  }

  const adminAuthClient = createAdminClient()
  const { error } = await adminAuthClient.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error removing member:', error)
    return { error: error.message }
  }

  revalidatePath('/team')
  return { success: true }
}

export async function promoteToOwner(formData: FormData) {
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER') {
    return { error: 'Unauthorized. Only the Super Owner can promote members.' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'User ID required' }

  const adminAuthClient = createAdminClient()
  const { error } = await adminAuthClient.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'OWNER' }
  })

  if (error) {
    console.error('Error promoting member:', error)
    return { error: error.message }
  }

  revalidatePath('/team')
  return { success: true }
}

export async function demoteToMember(formData: FormData) {
  const { role } = await getUserRole()
  if (role !== 'SUPER_OWNER') {
    return { error: 'Unauthorized.' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'User ID required' }

  const adminAuthClient = createAdminClient()
  const { error } = await adminAuthClient.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'MEMBER' }
  })

  if (error) {
    console.error('Error demoting member:', error)
    return { error: error.message }
  }

  revalidatePath('/team')
  return { success: true }
}

export async function transferSuperOwner(formData: FormData) {
  const { role, id: myId } = await getUserRole()
  if (role !== 'SUPER_OWNER' || !myId) {
    return { error: 'Unauthorized.' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { error: 'User ID required' }

  const adminAuthClient = createAdminClient()
  
  // 1. Promote target to SUPER_OWNER
  const { error: targetError } = await adminAuthClient.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'SUPER_OWNER' }
  })

  if (targetError) return { error: targetError.message }

  // 2. Demote self to OWNER
  await adminAuthClient.auth.admin.updateUserById(myId, {
    user_metadata: { role: 'OWNER' }
  })

  revalidatePath('/team')
  return { success: true }
}
