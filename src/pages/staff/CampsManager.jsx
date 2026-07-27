import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const COULEURS_SUGGEREES = ['#2f6b3a', '#c98a2e', '#6b3a5c', '#4a6b7a', '#a13d5c', '#3d7a8a', '#8a5a2e', '#5c6b2e']

function CampsManager() {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [nom, setNom] = useState('')
  const [type, setType] = useState('groupe')
  const [ordre, setOrdre] = useState(100)
  const [couleur, setCouleur] = useState(COULEURS_SUGGEREES[0])

  const [couleurEnEdition, setCouleurEnEdition] = useState({})

  useEffect(() => {
    chargerCamps()
  }, [])

  async function chargerCamps() {
    setLoading(true)
    const { data, error } = await supabase
      .from('camps_ref')
      .select('*')
      .order('ordre_affichage')
    if (error) {
      console.error('Erreur chargement camps :', error)
    } else {
      setCamps(data)
    }
    setLoading(false)
  }

  async function creerCamp(e) {
    e.preventDefault()
    setErreur(null)

    if (!nom.trim()) {
      setErreur('Le nom est obligatoire.')
      return
    }

    const { error } = await supabase.from('camps_ref').insert({
      name: nom.trim(),
      type,
      ordre_affichage: Number(ordre),
      actif: true,
      couleur,
    })

    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }

    setNom('')
    setType('groupe')
    setOrdre(100)
    setCouleur(COULEURS_SUGGEREES[0])
    chargerCamps()
  }

  async function basculerActif(camp) {
    const { error } = await supabase
      .from('camps_ref')
      .update({ actif: !camp.actif })
      .eq('id', camp.id)

    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }
    chargerCamps()
  }

  async function changerCouleur(campId) {
    const nouvelleCouleur = couleurEnEdition[campId]
    if (!nouvelleCouleur) return

    const { error } = await supabase
      .from('camps_ref')
      .update({ couleur: nouvelleCouleur })
      .eq('id', campId)

    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }
    chargerCamps()
  }

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Clans et groupes</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul className="person-list">
          {camps.map((camp) => (
            <li key={camp.id} style={{ display: 'block', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  className="sceau-clan"
                  style={{ background: camp.couleur || '#8a8070' }}
                >
                  {camp.name.charAt(camp.name.lastIndexOf(' ') + 1)}
                </span>
                <strong>{camp.name}</strong>
                <span style={{ color: 'var(--couleur-texte-discret)', fontSize: '0.85rem' }}>
                  ({camp.type}, ordre {camp.ordre_affichage})
                </span>
                {!camp.actif && <span className="badge-mort">inactif</span>}
                <button type="button" onClick={() => basculerActif(camp)}>
                  {camp.actif ? 'Désactiver' : 'Réactiver'}
                </button>
                <input
                  type="color"
                  value={couleurEnEdition[camp.id] || camp.couleur || '#8a8070'}
                  onChange={(e) => setCouleurEnEdition((prev) => ({ ...prev, [camp.id]: e.target.value }))}
                  style={{ width: 36, height: 28, padding: 0, cursor: 'pointer' }}
                />
                <button type="button" onClick={() => changerCouleur(camp.id)}>
                  Appliquer la couleur
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h2>Créer un nouveau clan/groupe</h2>
      <form onSubmit={creerCamp}>
        <div style={{ marginBottom: 12 }}>
          <label>Nom *<br />
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="search-input"
              placeholder="ex: Domestiques, La Lignée..."
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Type<br />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="groupe">Groupe (Solitaires, Domestiques...)</option>
              <option value="clan">Clan territorial</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Ordre d'affichage<br />
            <input
              type="number"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
              style={{ width: 100 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Couleur du camp<br />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                style={{ width: 44, height: 32, padding: 0, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {COULEURS_SUGGEREES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCouleur(c)}
                    title={c}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: c,
                      border: c === couleur ? '2px solid var(--couleur-texte)' : '1px solid var(--couleur-bordure)',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </label>
        </div>

        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

        <button type="submit">Créer</button>
      </form>
    </div>
  )
}

export default CampsManager
