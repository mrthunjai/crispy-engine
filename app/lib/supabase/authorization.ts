import 'server-only'

import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'

export type AuthorizationResult = {
  user: User | null
  isAdmin: boolean
  reason: 'authenticated' | 'unauthenticated' | 'forbidden' | 'not_configured'
}

export async function getAuthorization(): Promise<AuthorizationResult> {
  const supabase = await createClient()
  if (!supabase) return { user: null, isAdmin: false, reason: 'not_configured' }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { user: null, isAdmin: false, reason: 'unauthenticated' }

  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  return {
    user: data.user,
    isAdmin: !roleError && role?.role === 'admin',
    reason: roleError || !role ? 'forbidden' : 'authenticated'
  }
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  return error ? null : data.user
}

export async function isCurrentUserAdmin() {
  const authorization = await getAuthorization()
  return authorization.isAdmin
}

export async function requireAdminResponse() {
  const authorization = await getAuthorization()
  if (authorization.reason === 'not_configured' || authorization.reason === 'unauthenticated') {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 })
  }
  if (!authorization.isAdmin) {
    return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 })
  }
  return null
}

export async function requireAdminPage() {
  const authorization = await getAuthorization()
  if (authorization.reason === 'not_configured' || authorization.reason === 'unauthenticated') redirect('/account')
  if (!authorization.isAdmin) redirect('/')
  return authorization.user
}
