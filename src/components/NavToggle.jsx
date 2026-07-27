import { Link, useLocation } from 'react-router-dom'

function NavToggle() {
  const location = useLocation()
  const dansEspaceStaff = location.pathname.startsWith('/staff')

  if (dansEspaceStaff) {
    return (
      <Link to="/" className="lien-staff" title="Retour au site">
        🏠
      </Link>
    )
  }

  return (
    <Link to="/staff" className="lien-staff" title="Espace staff">
      🔑
    </Link>
  )
}

export default NavToggle