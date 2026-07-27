import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { iconeRang, prioriteRang, estRecent } from '../lib/rankUtils'
import { getCampColorMap } from '../lib/campColors'

function ClanPage() {
  const { campId } = useParams()
  const [camp, setCamp] = useState(null)
  const [members, setMembers] = useState([])
  const [nbDefunts, setNbDefunts] = useState(0)
  const [couleurs, setCouleurs] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtreType, setFiltreType] = useState('tous')

  useEffect(() => {
    getCampColorMap().then(setCouleurs)

    async function chargerDonnees() {
      setLoading(true)

      const { data: campData, error: campError } = await supabase
        .from('camps_ref')
        .select('*')
        .eq('id', campId)
        .single()

      if (campError) {
        console.error('Erreur chargement camp :', campError)
        setLoading(false)
        return
      }
      setCamp(campData)

      const { data: membersData, error: membersError } = await supabase
        .from('clan_memberships')
        .select('person_id, persons(id, name, avatar_url, dead, person_type, rank, created_at)')
        .eq('camp_id', campId)
        .is('date_fin', null)

      if (membersError) {
        console.error('Erreur chargement membres :', membersError)
      } else {
        const vivants = (membersData || []).filter((m) => !m.persons.dead)
        const morts = (membersData || []).filter((m) => m.persons.dead)
        setMembers(vivants)
        setNbDefunts(morts.length)
      }

      setLoading(false)
    }

    chargerDonnees()
  }, [campId])

  const membresFiltres = members
    .filter((m) => filtreType === 'tous' || m.persons.person_type === filtreType)
    .sort((a, b) => {
      const prioA = prioriteRang(a.persons.rank)
      const prioB = prioriteRang(b.persons.rank)
      if (prioA !== prioB) return prioA - prioB
      return a.persons.name.localeCompare(b.persons.name, 'fr')
    })

  if (loading) return <p className="page">Chargement...</p>
  if (!camp) return <p className="page">Ce clan/groupe n'existe pas.</p>

  const couleurCamp = couleurs[camp.name] || 'var(--couleur-texte-discret)'

  return (
    <div className="page">
      <div className="entete-page">
        <Link to="/" className="back-link">← Retour à l'accueil</Link>
        <div className="entete-fiche" style={{ marginTop: 12 }}>
          <span className="sceau-clan" style={{ width: 40, height: 40, fontSize: '1.1rem', background: couleurCamp }}>
            {camp.name.charAt(camp.name.lastIndexOf(' ') + 1)}
          </span>
          <h1 style={{ margin: 0 }}>{camp.name}</h1>
        </div>
        <p className="sous-titre">{members.length} membre{members.length > 1 ? 's' : ''} vivant{members.length > 1 ? 's' : ''}</p>
        {nbDefunts > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--couleur-texte-discret)', marginTop: 4 }}>
            {nbDefunts} ancien{nbDefunts > 1 ? 's' : ''} membre{nbDefunts > 1 ? 's' : ''} {nbDefunts > 1 ? 'reposent' : 'repose'} dans l'
            <Link to="/audela" className="lien-pantheon" style={{ display: 'inline' }}>Au-delà</Link>
          </p>
        )}
      </div>

      <div className="barre-filtres">
        <button type="button" className={`filtre-bouton ${filtreType === 'tous' ? 'actif' : ''}`} onClick={() => setFiltreType('tous')}>Joueurs + PNJ</button>
        <button type="button" className={`filtre-bouton ${filtreType === 'joueur' ? 'actif' : ''}`} onClick={() => setFiltreType('joueur')}>Joueurs</button>
        <button type="button" className={`filtre-bouton ${filtreType === 'pnj' ? 'actif' : ''}`} onClick={() => setFiltreType('pnj')}>PNJ</button>
      </div>

      {membresFiltres.length === 0 ? (
        <p className="empty">Aucun membre vivant pour ce filtre.</p>
      ) : (
        <ul className="grille-personnes">
          {membresFiltres.map((m) => (
            <li key={m.person_id}>
              <Link
                to={`/personnage/${m.persons.id}`}
                className="carte-personne"
                style={{ borderTop: `3px solid ${couleurCamp}` }}
              >
                {m.persons.avatar_url ? (
                  <img src={m.persons.avatar_url} alt="" className="avatar-xl" />
                ) : (
                  <div className="avatar-placeholder-xl">{m.persons.name.charAt(0)}</div>
                )}
                <span className="nom-personne">
                  {iconeRang(m.persons.rank) && <span title={m.persons.rank}>{iconeRang(m.persons.rank)} </span>}
                  {m.persons.name}
                  {estRecent(m.persons.created_at) && <span className="badge-nouveau">nouveau</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ClanPage