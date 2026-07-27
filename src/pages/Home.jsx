import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { iconeRang } from '../lib/rankUtils'
import { getCampColorMap } from '../lib/campColors'

function Home() {
  const [camps, setCamps] = useState([])
  const [effectifs, setEffectifs] = useState({})
  const [couleurs, setCouleurs] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [vedette, setVedette] = useState(null)
  const [stats, setStats] = useState({ personnages: 0, unions: 0, liens: 0 })

  useEffect(() => {
    getCampColorMap().then(setCouleurs)

    supabase
      .from('camps_ref')
      .select('*')
      .eq('actif', true)
      .order('ordre_affichage')
      .then(async ({ data, error }) => {
        if (error) {
          console.error('Erreur chargement camps :', error)
          return
        }
        setCamps(data)

        const { data: membresData } = await supabase
          .from('clan_memberships')
          .select('camp_id')
          .is('date_fin', null)

        const compteurs = {}
        ;(membresData || []).forEach((m) => {
          compteurs[m.camp_id] = (compteurs[m.camp_id] || 0) + 1
        })
        setEffectifs(compteurs)
      })

    chargerVedette()
    chargerStats()
  }, [])

  async function chargerStats() {
    const [r1, r2, r3] = await Promise.all([
      supabase.from('persons').select('id', { count: 'exact', head: true }).eq('archived', false),
      supabase.from('unions').select('id', { count: 'exact', head: true }),
      supabase.from('parentages').select('id', { count: 'exact', head: true }),
    ])

    setStats({
      personnages: r1.count || 0,
      unions: r2.count || 0,
      liens: r3.count || 0,
    })
  }

  async function chargerVedette() {
    const { count } = await supabase
      .from('persons')
      .select('id', { count: 'exact', head: true })
      .eq('archived', false)

    if (!count || count === 0) return

    const offsetAleatoire = Math.floor(Math.random() * count)

    const { data, error } = await supabase
      .from('persons')
      .select('id, name, avatar_url, description, dead, rank')
      .eq('archived', false)
      .order('id')
      .range(offsetAleatoire, offsetAleatoire)
      .single()

    if (error) {
      console.error('Erreur chargement vedette :', error)
      return
    }
    setVedette(data)
  }

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      return
    }

    const delai = setTimeout(() => {
      supabase
        .from('persons')
        .select('id, name, avatar_url, dead')
        .ilike('name', `%${searchTerm}%`)
        .eq('archived', false)
        .limit(8)
        .then(({ data, error }) => {
          if (error) console.error('Erreur recherche :', error)
          setSearchResults(data || [])
        })
    }, 300)

    return () => clearTimeout(delai)
  }, [searchTerm])

  return (
    <div className="page">
      <div className="entete-page">
        <p className="sous-titre">Registre des lignées</p>
        <h1>Le Prix de la Trêve</h1>
        <input
          type="text"
          className="search-input-hero"
          placeholder="Chercher un personnage par son nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <Link to="/pantheon" className="lien-pantheon">🏆 Panthéon</Link>
          <Link to="/informations" className="lien-pantheon">📊 Informations</Link>
        </div>

        <div className="bandeau-stats">
          <div className="stat-item">
            <span className="stat-valeur">{stats.personnages}</span>
            <span className="stat-label">Personnages</span>
          </div>
          <div className="stat-item">
            <span className="stat-valeur">{stats.unions}</span>
            <span className="stat-label">Unions</span>
          </div>
          <div className="stat-item">
            <span className="stat-valeur">{stats.liens}</span>
            <span className="stat-label">Liens de filiation</span>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <ul className="person-list" style={{ marginBottom: 32 }}>
          {searchResults.map((person) => (
            <li key={person.id}>
              <Link to={`/personnage/${person.id}`} className={person.dead ? 'person-name-dead' : ''}>
                <div className="ligne-personne">
                  {person.avatar_url ? (
                    <img src={person.avatar_url} alt="" className="avatar" />
                  ) : (
                    <div className="avatar-placeholder">{person.name.charAt(0)}</div>
                  )}
                  <span>
                    {person.name}
                    {person.dead && <span className="badge-mort">mort</span>}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {vedette && (
        <Link to={`/personnage/${vedette.id}`} className="carte-vedette">
          {vedette.avatar_url ? (
            <img src={vedette.avatar_url} alt="" className="avatar-xl" />
          ) : (
            <div className="avatar-placeholder-xl">{vedette.name.charAt(0)}</div>
          )}
          <div>
            <span className="eyebrow-vedette">Portrait du moment</span>
            <span className="nom-vedette">
              {iconeRang(vedette.rank) && <span title={vedette.rank}>{iconeRang(vedette.rank)} </span>}
              {vedette.name}
              {vedette.dead && <span className="badge-mort">mort</span>}
            </span>
            {vedette.description && (
              <p className="description-vedette">
                {vedette.description.length > 120
                  ? vedette.description.slice(0, 120) + '…'
                  : vedette.description}
              </p>
            )}
          </div>
        </Link>
      )}

      <div className="family-section">
        <h2>Clans et groupes</h2>
        <ul className="grille-camps">
          {camps.map((camp) => (
            <li key={camp.id}>
              <Link
                to={`/clan/${camp.id}`}
                className="carte-camp"
                style={{ '--couleur-camp': couleurs[camp.name] || 'var(--couleur-texte-discret)' }}
              >
                <span className="sceau-clan" style={{ width: 40, height: 40, fontSize: '1.1rem', background: couleurs[camp.name] || 'var(--couleur-texte-discret)' }}>
                  {camp.name.charAt(camp.name.lastIndexOf(' ') + 1)}
                </span>
                <span className="nom-camp">{camp.name}</span>
                <span className="meta-camp">
                  {effectifs[camp.id] || 0} membre{(effectifs[camp.id] || 0) > 1 ? 's' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="family-section">
        <h2>L'Au-delà</h2>
        <div className="grille-audela">
          <Link to="/audela#etoiles" className="carte-audela carte-audela-etoiles">
            <span className="audela-icone">✨</span>
            <span>Clan des Étoiles</span>
          </Link>
          <Link to="/audela#sombre" className="carte-audela carte-audela-sombre">
            <span className="audela-icone">🌑</span>
            <span>Forêt Sombre</span>
          </Link>
          <Link to="/audela#purgatoire" className="carte-audela carte-audela-purgatoire">
            <span className="audela-icone">🌫️</span>
            <span>Purgatoire</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
