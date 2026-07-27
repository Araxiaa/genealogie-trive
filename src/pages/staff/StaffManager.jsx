import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function StaffManager() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [discordId, setDiscordId] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [role, setRole] = useState('staff')

  useEffect(() => {
    chargerMembres()
  }, [])

  async function chargerMembres() {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('added_at')
    if (error) {
      console.error('Erreur chargement staff :', error)
    } else {
      setMembres(data)
    }
    setLoading(false)
  }

  async function ajouterMembre(e) {
    e.preventDefault()
    setErreur(null)

    if (!discordId.trim() || !pseudo.trim()) {
      setErreur('L\'ID Discord et le pseudo sont obligatoires.')
      return
    }

    const { error } = await supabase.from('staff_members').insert({
      discord_user_id: discordId.trim(),
      discord_username: pseudo.trim(),
      role,
    })

    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }

    setDiscordId('')
    setPseudo('')
    setRole('staff')
    chargerMembres()
  }

  async function retirerMembre(id) {
    if (!confirm('Retirer ce membre du staff ? Il perdra tout accès au panel.')) return
    const { error } = await supabase.from('staff_members').delete().eq('id', id)
    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }
    chargerMembres()
  }

  async function changerRole(id, nouveauRole) {
    const { error } = await supabase
      .from('staff_members')
      .update({ role: nouveauRole })
      .eq('id', id)
    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }
    chargerMembres()
  }

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Gestion du staff</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul className="person-list">
          {membres.map((m) => (
            <li key={m.id}>
              {m.discord_username}{' '}
              <span style={{ color: '#a89e8f', fontSize: '0.85rem' }}>
                ({m.auth_user_id ? 'connecté au moins une fois' : 'en attente de première connexion'})
              </span>
              {' '}
              <select value={m.role} onChange={(e) => changerRole(m.id, e.target.value)}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              {' '}
              <button type="button" onClick={() => retirerMembre(m.id)}>Retirer</button>
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h2>Ajouter un membre du staff</h2>
      <p style={{ color: '#a89e8f', fontSize: '0.9rem' }}>
        Récupère son ID Discord (mode développeur activé sur Discord → clic droit sur son profil → Copier l'identifiant utilisateur). L'accès s'activera automatiquement à sa première connexion sur le site.
      </p>
      <form onSubmit={ajouterMembre}>
        <div style={{ marginBottom: 12 }}>
          <label>ID Discord *<br />
            <input
              type="text"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              className="search-input"
              placeholder="ex: 123456789012345678"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Pseudo (pour s'y retrouver) *<br />
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="search-input"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Rôle<br />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

        <button type="submit">Ajouter</button>
      </form>
    </div>
  )
}

export default StaffManager