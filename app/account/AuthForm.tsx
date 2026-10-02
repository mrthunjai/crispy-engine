'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

export default function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'reset') setMode('reset')
    if (!supabase) return
    void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!supabase) { setError('Authentication is not configured.'); return }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`
          }
        })
        if (signupError) throw signupError
        if (data.session) router.refresh()
        else setMessage('Check your email to verify your account before logging in.')
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/account%3Fmode=reset`
        })
        if (resetError) throw resetError
        setMessage('If an account exists for that email, a reset link has been sent.')
      } else if (mode === 'reset') {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        setMessage('Your password has been updated. You can now log in.')
        setMode('login')
        setPassword('')
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
        router.refresh()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUserEmail(null)
    router.refresh()
  }

  if (userEmail && mode !== 'reset') return <div className="mt-12 bg-white p-7"><p className="text-sm">Signed in as {userEmail}</p><button onClick={logout} className="mt-7 w-full bg-ink py-4 text-[10px] uppercase tracking-[.2em] text-white">Log out</button></div>

  const heading = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Log in'
  return <div className="mt-12 bg-white p-7">
    <h2 className="text-2xl tracking-tight">{heading}</h2>
    <form onSubmit={submit} className="mt-7">
      {mode === 'signup' && <input className="field" placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />}
      {mode !== 'reset' && <input className="field mt-5" placeholder="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />}
      {mode !== 'forgot' && <input className="field mt-5" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />}
      {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="mt-4 text-left text-xs text-ink underline">Forgot your password?</button>}
      {error && <p className="mt-5 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-5 text-sm text-green-700">{message}</p>}
      <button disabled={busy} className="mt-7 w-full bg-ink py-4 text-[10px] uppercase tracking-[.2em] text-white disabled:opacity-50">{busy ? 'Please wait' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Log in'}</button>
    </form>
    <div className="mt-6 flex flex-col gap-3 text-center text-xs text-black/50">
      {mode === 'login' && <button onClick={() => setMode('signup')} className="text-ink underline">New here? Create an account</button>}
      {mode !== 'login' && <button onClick={() => setMode('login')} className="text-ink underline">Back to login</button>}
    </div>
  </div>
}
