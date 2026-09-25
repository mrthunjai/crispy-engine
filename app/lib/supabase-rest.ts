type RestOptions = RequestInit & { prefer?: string }

export const hasSupabaseServerConfig = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function supabaseRest<T>(path: string, options: RestOptions = {}): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server environment is not configured')
  const headers = new Headers(options.headers)
  headers.set('apikey', key)
  headers.set('Authorization', `Bearer ${key}`)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (options.prefer) headers.set('Prefer', options.prefer)
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers, cache: 'no-store' })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase REST ${response.status}: ${detail}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
