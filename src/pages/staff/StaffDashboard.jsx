import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/useAuth.jsx'
import { supabase } from '../../lib/supabaseClient'

const OUTILS = [
  { to: '/staff/creer-personnage', icone: '➕', titre: 'Créer un personnage', description: 'Nouvelle fiche, avatar, camp d\'origine' },
  { to: '/staff/personnages', icone: '📋', titre: 'Tous les personnages', description: 'Liste complète, filtres, modification' },
  { to: '/staff/camps', icone: '🗺️', titre: 'Clans et groupes', description: 'Créer, désactiver, choisir une couleur' },
  { to: '/staff/compatibilite', icone: '💞', titre: 'Compatibilité', description: 'Vérifier un ancêtre commun avant union' },
  { to: '/staff/verification', icone: '⚠️', titre: 'Incohérences', description: 'Portées, camps inactifs, unions actives' },
  { to: '/staff/fusion', icone: '🔀', titre: 'Fusionner des doublons', description: 'Réattribuer les liens vers une seule fiche' },
  { to: '/staff/historique', icone: '🕓', titre: 'Historique', description: 'Qui a modifié quoi, et quand' },
]

function StaffDashboard() {
  const { session, isAdmin, seDeconnecter } = useAuth()
  const [stats, setStats] = useState({ vivants: 0, morts: 0, sansCamp: 0, archives: 0 })

  useEffect(() => {
    chargerStats()
  }, [])

  async function chargerStats() {
    const { data: personsData } = await supabase
      .from('persons')
      .select('id, archived, dead')

    const { data: campsData } = await supabase
      .from('clan_memberships')
      .select('person_id')
      .is('date_fin', null)

    const idsAvecCamp = new Set((campsData || []).map((c) => c.person_id))
    const actifs = (personsData || []).filter((p) => !p.archived)
    const vivants = actifs.filter((p) => !p.dead)

    setStats({
      vivants: vivants.length,
      morts: actifs.length - vivants.length,
      sansCamp: vivants.filter((p) => !idsAvecCamp.has(p.id)).length,
      archives: (personsData || []).filter((p) => p.archived).length,
    })
  }

  const pseudo = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.custom_claims?.global_name || session?.user?.email

  return (
    <div className="page">
      <div className="entete-page">
        <p className="sous-titre">Espace staff</p>
        <h1>Tableau de bord</h1>
        <p style={{ marginTop: 8 }}>
          Connecté en tant que <strong>{pseudo}</strong>
          {' '}<span className="badge-mort" style={{ background: isAdmin ? 'var(--couleur-accent)' : undefined, color: isAdmin ? 'white' : undefined }}>
            {isAdmin ? 'Administrateur' : 'Staff'}
          </span>
        </p>

        <div className="bandeau-stats">
          <div className="stat-item">
            <span className="stat-valeur">{stats.vivants}</span>
            <span className="stat-label">Vivants</span>
          </div>
          <div className="stat-item">
            <span className="stat-valeur">{stats.morts}</span>
            <span className="stat-label">Défunts</span>
          </div>
          <div className="stat-item">
            <span className="stat-valeur" style={{ color: stats.sansCamp > 0 ? 'var(--couleur-accent)' : undefined }}>{stats.sansCamp}</span>
            <span className="stat-label">Vivants sans camp</span>
          </div>
          <div className="stat-item">
            <span className="stat-valeur">{stats.archives}</span>
            <span className="stat-label">Archivés</span>
          </div>
        </div>
      </div>

      <div className="grille-outils-staff">
        {OUTILS.map((outil) => (
          <Link key={outil.to} to={outil.to} className="carte-outil-staff">
            <span className="carte-outil-icone">{outil.icone}</span>
            <span className="carte-outil-titre">{outil.titre}</span>
            <span className="carte-outil-description">{outil.description}</span>
          </Link>
        ))}

        {isAdmin && (
          <Link to="/staff/gestion-staff" className="carte-outil-staff carte-outil-admin">
            <span className="carte-outil-icone">🛡️</span>
            <span className="carte-outil-titre">Gérer le staff</span>
            <span className="carte-outil-description">Ajouter ou retirer des membres, rôles</span>
          </Link>
        )}
      </div>

      <button type="button" onClick={seDeconnecter} style={{ marginTop: 32 }}>
        Se déconnecter
      </button>
    </div>
  )
}

export default StaffDashboard