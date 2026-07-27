import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isStaff, setIsStaff] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      verifierStaff(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      verifierStaff(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function verifierStaff(session) {
    if (!session) {
      setIsStaff(false)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    // 1. Vérifie d'abord si ce compte est déjà lié à une entrée staff
    let { data } = await supabase
      .from('staff_members')
      .select('role')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    // 2. Sinon, vérifie s'il existe une entrée "en attente" créée avec son ID Discord
    if (!data) {
      const discordId = session.user.user_metadata?.provider_id

      if (discordId) {
        const { data: pending } = await supabase
          .from('staff_members')
          .select('id, role')
          .eq('discord_user_id', discordId)
          .is('auth_user_id', null)
          .maybeSingle()

        if (pending) {
          // Réclame cette entrée : on la lie désormais à ce compte connecté
          await supabase
            .from('staff_members')
            .update({ auth_user_id: session.user.id })
            .eq('id', pending.id)

          data = { role: pending.role }
        }
      }
    }

    setIsStaff(!!data)
    setIsAdmin(data?.role === 'admin')
    setLoading(false)
  }

  async function seConnecterAvecDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin + '/staff' },
    })
  }

  async function seDeconnecter() {
    await supabase.auth.signOut()
  }

  const value = { session, isStaff, isAdmin, loading, seConnecterAvecDiscord, seDeconnecter }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}