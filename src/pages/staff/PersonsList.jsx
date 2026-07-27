import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function PersonsList() {
  const [persons, setPersons] = useState([])
  const [filtre, setFiltre] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('vivants')
  const [filtreType, setFiltreType] = useState('tous')
  const [montrerArchives, setMontrerArchives] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerPersons()
  }, [montrerArchives])

  async function chargerPersons() {
    setLoading(true)
    let query = supabase
      .from('persons')
      .select('id, name, person_type, dead, archived')
      .order('name')

    if (!montrerArchives) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erreur chargement personnages :', error)
    } else {
      setPersons(data)
    }
    setLoading(false)
  }

  const personsFiltres = persons
    .filter((p) => p.name.toLowerCase().includes(filtre.toLowerCase()))
    .filter((p) => {
      if (filtreStatut === 'vivants' && p.dead) return false
      if (filtreStatut === 'morts' && !p.dead) return false
      return true
    })
    .filter((p) => filtreType === 'tous' || p.person_type === filtreType)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  // Regroupement par première lettre pour un vrai tri alphabétique visuel
  const groupes = {}
  personsFiltres.forEach((p) => {
    const lettre = p.name.charAt(0).toUpperCase()
    if (!groupes[lettre]) groupes[lettre] = []
    groupes[lettre].push(p)
  })
  const lettres = Object.keys(groupes).sort((a, b) => a.localeCompare(b, 'fr'))

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Personnages ({personsFiltres.length})</h1>

      <input
        type="text"
        className="search-input"
        placeholder="Filtrer par nom..."
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
      />

      <div className="barre-filtres" style={{ marginTop: 8 }}>
        <button type="button" className={`filtre-bouton ${filtreStatut === 'vivants' ? 'actif' : ''}`} onClick={() => setFiltreStatut('vivants')}>Vivants</button>
        <button type="button" className={`filtre-bouton ${filtreStatut === 'morts' ? 'actif' : ''}`} onClick={() => setFiltreStatut('morts')}>Morts</button>
        <button type="button" className={`filtre-bouton ${filtreStatut === 'tous' ? 'actif' : ''}`} onClick={() => setFiltreStatut('tous')}>Tous</button>
        <span style={{ width: 1, background: 'var(--couleur-bordure)', margin: '0 4px' }} />
        <button type="button" className={`filtre-bouton ${filtreType === 'tous' ? 'actif' : ''}`} onClick={() => setFiltreType('tous')}>Joueurs + PNJ</button>
        <button type="button" className={`filtre-bouton ${filtreType === 'joueur' ? 'actif' : ''}`} onClick={() => setFiltreType('joueur')}>Joueurs</button>
        <button type="button" className={`filtre-bouton ${filtreType === 'pnj' ? 'actif' : ''}`} onClick={() => setFiltreType('pnj')}>PNJ</button>
      </div>

      <label style={{ display: 'block', margin: '12px 0' }}>
        <input
          type="checkbox"
          checked={montrerArchives}
          onChange={(e) => setMontrerArchives(e.target.checked)}
        />
        {' '}Inclure les personnages archivés
      </label>

      {loading ? (
        <p>Chargement...</p>
      ) : personsFiltres.length === 0 ? (
        <p className="empty">Aucun personnage pour ce filtre.</p>
      ) : (
        <>
          <div className="index-alphabetique">
            {lettres.map((l) => (
              <a key={l} href={`#lettre-${l}`}>{l}</a>
            ))}
          </div>

          {lettres.map((lettre) => (
            <div key={lettre} id={`lettre-${lettre}`} className="groupe-alphabetique">
              <h2 className="titre-lettre">{lettre}</h2>
              <ul className="person-list">
                {groupes[lettre].map((p) => (
                  <li key={p.id}>
                    <Link to={`/staff/personnage/${p.id}/modifier`}>
                      {p.name}
                      {p.dead && <span className="badge-mort">mort</span>}
                      {p.archived && <span className="badge-mort">archivé</span>}
                      {' '}<span style={{ color: 'var(--couleur-texte-discret)', fontSize: '0.85rem' }}>({p.person_type})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default PersonsList