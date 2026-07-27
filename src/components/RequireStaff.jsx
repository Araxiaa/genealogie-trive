import { useAuth } from '../lib/useAuth.jsx'

function RequireStaff({ children, adminOnly = false }) {
  const { session, isStaff, isAdmin, loading, seConnecterAvecDiscord } = useAuth()

  if (loading) return <p>Vérification en cours...</p>

  if (!session) {
    return (
      <div className="page">
        <h1>Espace staff</h1>
        <p>Connecte-toi avec ton compte Discord pour accéder à cette section.</p>
        <button onClick={seConnecterAvecDiscord}>Se connecter avec Discord</button>
      </div>
    )
  }

  if (!isStaff) {
    return (
      <div className="page">
        <h1>Accès refusé</h1>
        <p>Ton compte Discord est bien connecté, mais tu n'as pas encore les droits staff sur ce site. Contacte un administrateur.</p>
      </div>
    )
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="page">
        <h1>Accès refusé</h1>
        <p>Cette section est réservée aux administrateurs.</p>
      </div>
    )
  }

  return children
}

export default RequireStaff