import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const LABELS_TABLE = {
  persons: 'Personnage',
  unions: 'Union',
  parentages: 'Filiation',
  clan_memberships: 'Appartenance à un camp',
}

const LABELS_ACTION = {
  insert: 'Création',
  update: 'Modification',
  delete: 'Suppression',
}

function AuditLogViewer() {
  const [entries, setEntries] = useState([])
  const [staffNames, setStaffNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtreTable, setFiltreTable] = useState('toutes')

  useEffect(() => {
    chargerAudit()
  }, [filtreTable])

  async function chargerAudit() {
    setLoading(true)

    let query = supabase
      .from('audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(100)

    if (filtreTable !== 'toutes') {
      query = query.eq('table_name', filtreTable)
    }

    const { data, error } = await query
    if (error) {
      console.error('Erreur chargement audit :', error)
      setLoading(false)
      return
    }
    setEntries(data || [])

    // Récupère les pseudos des membres staff impliqués, en une seule requête
    const idsStaff = [...new Set(data.map((e) => e.changed_by).filter(Boolean))]
    if (idsStaff.length > 0) {
      const { data: staffData } = await supabase
        .from('staff_members')
        .select('auth_user_id, discord_username')
        .in('auth_user_id', idsStaff)

      const map = {}
      ;(staffData || []).forEach((s) => {
        map[s.auth_user_id] = s.discord_username
      })
      setStaffNames(map)
    }

    setLoading(false)
  }

  // Compare before/after et retourne la liste des champs qui ont changé
  function champsModifies(before, after) {
    if (!before || !after) return []
    const champs = new Set([...Object.keys(before), ...Object.keys(after)])
    const resultat = []
    champs.forEach((champ) => {
      if (champ === 'updated_at' || champ === 'created_at') return
      const avant = before[champ]
      const apres = after[champ]
      if (JSON.stringify(avant) !== JSON.stringify(apres)) {
        resultat.push({ champ, avant, apres })
      }
    })
    return resultat
  }

  function nomLisible(data) {
    return data?.name || data?.id || '?'
  }

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Historique des modifications</h1>

      <label style={{ display: 'block', marginBottom: 16 }}>
        Filtrer par type :{' '}
        <select value={filtreTable} onChange={(e) => setFiltreTable(e.target.value)}>
          <option value="toutes">Toutes</option>
          <option value="persons">Personnages</option>
          <option value="unions">Unions</option>
          <option value="parentages">Filiations</option>
          <option value="clan_memberships">Appartenances</option>
        </select>
      </label>

      {loading ? (
        <p>Chargement...</p>
      ) : entries.length === 0 ? (
        <p className="empty">Aucune modification enregistrée pour ce filtre.</p>
      ) : (
        <ul className="person-list">
          {entries.map((entry) => {
            const modifs = entry.action === 'update' ? champsModifies(entry.before_data, entry.after_data) : []
            const sujet = nomLisible(entry.after_data || entry.before_data)
            const auteur = staffNames[entry.changed_by] || 'Inconnu'

            return (
              <li key={entry.id} style={{ padding: '10px 14px', marginBottom: 6, background: 'white', borderRadius: 8, border: '1px solid #e8e2d8' }}>
                <div>
                  <strong>{LABELS_ACTION[entry.action]}</strong> — {LABELS_TABLE[entry.table_name] || entry.table_name} : {sujet}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a89e8f' }}>
                  par {auteur} — {new Date(entry.changed_at).toLocaleString('fr-FR')}
                </div>
                {modifs.length > 0 && (
                  <ul style={{ marginTop: 6, fontSize: '0.9rem' }}>
                    {modifs.map((m) => (
                      <li key={m.champ}>
                        <strong>{m.champ}</strong> : {String(m.avant ?? '(vide)')} → {String(m.apres ?? '(vide)')}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default AuditLogViewer