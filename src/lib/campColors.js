import { supabase } from './supabaseClient'

let cache = null

export async function getCampColorMap(forcerRechargement = false) {
  if (cache && !forcerRechargement) return cache

  const { data, error } = await supabase.from('camps_ref').select('name, couleur')
  if (error) {
    console.error('Erreur chargement couleurs camps :', error)
    return {}
  }

  cache = {}
  data.forEach((c) => {
    cache[c.name] = c.couleur || '#8a8070'
  })
  return cache
}