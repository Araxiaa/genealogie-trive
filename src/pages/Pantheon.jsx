import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import PersonListItem from '../components/PersonListItem'

const LIMITE = 10

function Pantheon() {
  const [chatons, setChatons] = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [sangMele, setSangMele] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerRecords()
  }, [])

  async function chargerRecords() {
    setLoading(true)

    const [r1, r2, r3] = await Promise.all([
      supabase.from('v_record_chatons').select('*').limit(LIMITE),
      supabase.from('v_record_partenaires').select('*').limit(LIMITE),
      supabase.from('v_record_sang_mele').select('*').gt('nb_clans_lignee', 0).limit(LIMITE),
    ])

    // Récupère les noms/avatars pour chatons et partenaires
    // (sang_mele a déjà le nom directement dans sa vue)
    const idsAChercher = new Set()
    ;(r1.data || []).forEach((x) => idsAChercher.add(x.parent_id))
    ;(r2.data || []).forEach((x) => idsAChercher.add(x.person_id))

    let personnes = {}
    if (idsAChercher.size > 0) {
      const { data: personsData } = await supabase
        .from('persons')
        .select('id, name, avatar_url, dead')
        .in('id', [...idsAChercher])
      ;(personsData || []).forEach((p) => { personnes[p.id] = p })
    }

    setChatons((r1.data || []).map((x) => ({ ...x, persons: personnes[x.parent_id] })).filter((x) => x.persons))
    setPartenaires((r2.data || []).map((x) => ({ ...x, persons: personnes[x.person_id] })).filter((x) => x.persons))
    setSangMele(r3.data || [])

    setLoading(false)
  }

  if (loading) return <p className="page">Chargement du Panthéon...</p>

  return (
    <div className="page">
      <div className="entete-page">
        <Link to="/" className="back-link">← Retour à l'accueil</Link>
        <p className="sous-titre">Panthéon</p>
        <h1>Les records du Prix de la Trêve</h1>
      </div>

      <div className="famille-classement">
        <h2>🐾 Le plus de chatons</h2>
        {chatons.length === 0 ? (
          <p className="empty">Aucun record pour l'instant.</p>
        ) : (
          <ol className="liste-classement">
            {chatons.map((c, i) => (
              <li key={c.parent_id}>
                <span className="rang">{i + 1}</span>
                <PersonListItem person={c.persons} extra={`${c.nb_chatons} chaton${c.nb_chatons > 1 ? 's' : ''}`} />
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="famille-classement">
        <h2>💞 Le plus de partenaires</h2>
        {partenaires.length === 0 ? (
          <p className="empty">Aucun record pour l'instant.</p>
        ) : (
          <ol className="liste-classement">
            {partenaires.map((p, i) => (
              <li key={p.person_id}>
                <span className="rang">{i + 1}</span>
                <PersonListItem person={p.persons} extra={`${p.nb_partenaires} partenaire${p.nb_partenaires > 1 ? 's' : ''}`} />
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="famille-classement">
        <h2>🩸 Le sang le plus mélangé</h2>
        {sangMele.length === 0 ? (
          <p className="empty">Aucun record pour l'instant.</p>
        ) : (
          <ol className="liste-classement">
            {sangMele.map((s, i) => (
              <li key={s.id}>
                <span className="rang">{i + 1}</span>
                <PersonListItem person={s} extra={`${s.nb_clans_lignee} camps dans la lignée`} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

export default Pantheon