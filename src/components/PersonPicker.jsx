import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// Permet de chercher un personnage existant et d'en sélectionner un.
// excludeId : évite qu'un personnage se sélectionne lui-même (ex: comme son propre parent)
function PersonPicker({ onSelect, excludeId }) {
  const [terme, setTerme] = useState('')
  const [resultats, setResultats] = useState([])
  const [selectionne, setSelectionne] = useState(null)

  useEffect(() => {
    if (terme.trim().length < 2) {
      setResultats([])
      return
    }

    const delai = setTimeout(() => {
      let query = supabase
        .from('persons')
        .select('id, name, dead')
        .ilike('name', `%${terme}%`)
        .eq('archived', false)
        .limit(8)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      query.then(({ data, error }) => {
        if (error) console.error('Erreur recherche :', error)
        setResultats(data || [])
      })
    }, 300)

    return () => clearTimeout(delai)
  }, [terme, excludeId])

  function choisir(person) {
    setSelectionne(person)
    setResultats([])
    setTerme('')
    onSelect(person)
  }

  function reinitialiser() {
    setSelectionne(null)
    onSelect(null)
  }

  if (selectionne) {
    return (
      <div>
        <strong>{selectionne.name}</strong>{' '}
        <button type="button" onClick={reinitialiser}>Changer</button>
      </div>
    )
  }

  return (
    <div>
      <input
        type="text"
        className="search-input"
        placeholder="Rechercher un personnage..."
        value={terme}
        onChange={(e) => setTerme(e.target.value)}
      />
      {resultats.length > 0 && (
        <ul className="search-results">
          {resultats.map((p) => (
            <li key={p.id}>
              <a href="#" onClick={(e) => { e.preventDefault(); choisir(p) }}>
                {p.name} {p.dead && '💀'}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PersonPicker