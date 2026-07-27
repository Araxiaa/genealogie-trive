import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import PersonListItem from '../components/PersonListItem'

const DESTINATIONS = [
  { cle: 'etoiles', motCle: 'Étoiles', titre: 'Le Clan des Étoiles', classe: 'audela-etoiles', icone: '✨' },
  { cle: 'sombre', motCle: 'Sombre', titre: 'La Forêt Sombre', classe: 'audela-sombre', icone: '🌑' },
  { cle: 'purgatoire', motCle: 'Purgatoire', titre: 'Le Purgatoire', classe: 'audela-purgatoire', icone: '🌫️' },
]

function AuDela() {
  const [groupes, setGroupes] = useState({})
  const [sansDestination, setSansDestination] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerDefunts()
  }, [])

  async function chargerDefunts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('persons')
      .select('id, name, avatar_url, dead, afterlife')
      .eq('dead', true)
      .eq('archived', false)
      .order('name')

    if (error) {
      console.error('Erreur chargement défunts :', error)
      setLoading(false)
      return
    }

    const g = { etoiles: [], sombre: [], purgatoire: [] }
    const sans = []

    ;(data || []).forEach((p) => {
      const dest = DESTINATIONS.find((d) => p.afterlife && p.afterlife.toLowerCase().includes(d.motCle.toLowerCase()))
      if (dest) {
        g[dest.cle].push(p)
      } else {
        sans.push(p)
      }
    })

    setGroupes(g)
    setSansDestination(sans)
    setLoading(false)
  }

  if (loading) return <p className="page">Chargement de l'Au-delà...</p>

  return (
    <div className="page">
      <div className="entete-page">
        <Link to="/" className="back-link">← Retour à l'accueil</Link>
        <p className="sous-titre">Les chats qui ont quitté ce monde</p>
        <h1>L'Au-delà</h1>
      </div>

      {DESTINATIONS.map((dest) => (
        <div key={dest.cle} id={dest.cle} className={`bloc-audela ${dest.classe}`}>
          <h2>{dest.icone} {dest.titre}</h2>
          {groupes[dest.cle] && groupes[dest.cle].length > 0 ? (
            <ul className="person-list">
              {groupes[dest.cle].map((p) => (
                <li key={p.id}><PersonListItem person={p} /></li>
              ))}
            </ul>
          ) : (
            <p className="empty">Personne pour l'instant.</p>
          )}
        </div>
      ))}

      {sansDestination.length > 0 && (
        <div className="family-section">
          <h2>Destination non renseignée</h2>
          <ul className="person-list">
            {sansDestination.map((p) => (
              <li key={p.id}><PersonListItem person={p} /></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AuDela