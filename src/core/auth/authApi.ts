import { supabase } from '../../lib/supabase'

export function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.'
  if (m.includes('already registered')) return 'Ya existe una cuenta con ese correo.'
  if (m.includes('at least')) return 'La contraseña no cumple el largo mínimo.'
  if (m.includes('same password')) return 'La nueva contraseña debe ser distinta a la anterior.'
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  }
  return 'No se pudo completar la acción. Inténtalo de nuevo.'
}

export async function signUp(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin + '/login' },
  })
  return error ? translateAuthError(error.message) : null
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? translateAuthError(error.message) : null
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  })
  return error ? translateAuthError(error.message) : null
}

export async function updatePassword(password: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password })
  return error ? translateAuthError(error.message) : null
}