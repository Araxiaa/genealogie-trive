import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function IncoherenceChecker() {
  const [portees, setPortees] = useState([])
  const [tropDePortees, setTropDePortees] = useState([])
  const [campsInactifs, setCampsInactifs] = useState([])
  const [mortsUnionActive, setMortsUnionActive] = useState([])
  const [noms, setNoms] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifier()
  }, [])

  async function verifier() {
    setLoading(true)

    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from('v_incoherence_portee_trop_grande').select('*'),
      supabase.from('v_incoherence_trop_de_portees').select('*'),
      supabase.from('v_incoherence_camp_inactif').select('*'),
      supabase.from('v_incoherence_mort_union_active').select('*'),
    ])

    setPortees(r1.data || [])
    setTropDePortees(r2.data || [])
    setCampsInactifs(r3.data || [])
    setMortsUnionActive(r4.data || [])

    // Récupère les noms de tous les personnages impliqués, en une seule requête
    const idsImpliques = new Set()
    ;(r1.data || []).forEach((x) => idsImpliques.add(x.parent_id))
    ;(r2.data || []).forEach((x) => idsImpliques.add(x.parent_id))
    ;(r3.data || []).forEach((x) => idsImpliques.add(x.person_id))
    ;(r4.data || []).forEach((x) => {
      idsImpliques.add(x.person_a_id)
      idsImpliques.add(x.person_b_id)
    })

    if (idsImpliques.size > 0) {
      const { data: personsData } = await supabase
        .from('persons')
        .select('id, name')
        .in('id', [...idsImpliques])

      const map = {}
      ;(personsData || []).forEach((p) => { map[p.id] = p.name })
      setNoms(map)
    }

    setLoading(false)
  }

  const totalProblemes = portees.length + tropDePortees.length + campsInactifs.length + mortsUnionActive.length

  if (loading) return <p className="page">Vérification en cours...</p>

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Détection d'incohérences</h1>

      {totalProblemes === 0 ? (
        <p>✅ Aucune incohérence détectée actuellement.</p>
      ) : (
        <p>{totalProblemes} point(s) à vérifier.</p>
      )}

      {portees.length > 0 && (
        <div className="family-section">
          <h2>Portées de plus de 4 chatons</h2>
          <ul className="person-list">
            {portees.map((p, i) => (
              <li key={i}>
                <Link to={`/staff/personnage/${p.parent_id}/modifier`}>
                  {noms[p.parent_id] || p.parent_id}
                </Link>{' '}
                — {p.nb_enfants} enfants dans cette union
              </li>
            ))}
          </ul>
        </div>
      )}

      {tropDePortees.length > 0 && (
        <div className="family-section">
          <h2>Plus de 3 portées</h2>
          <ul className="person-list">
            {tropDePortees.map((p, i) => (
              <li key={i}>
                <Link to={`/staff/personnage/${p.parent_id}/modifier`}>
                  {noms[p.parent_id] || p.parent_id}
                </Link>{' '}
                — {p.nb_portees} unions distinctes avec descendance
              </li>
            ))}
          </ul>
        </div>
      )}

      {campsInactifs.length > 0 && (
        <div className="family-section">
          <h2>Membres actuels d'un camp désactivé</h2>
          <ul className="person-list">
            {campsInactifs.map((p, i) => (
              <li key={i}>
                <Link to={`/staff/personnage/${p.person_id}/modifier`}>
                  {noms[p.person_id] || p.person_id}
                </Link>{' '}
                — toujours rattaché à "{p.camp_name}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {mortsUnionActive.length > 0 && (
        <div className="family-section">
          <h2>Union active impliquant un personnage mort</h2>
          <ul className="person-list">
            {mortsUnionActive.map((p, i) => (
              <li key={i}>
                <Link to={`/staff/personnage/${p.person_a_id}/modifier`}>
                  {noms[p.person_a_id] || p.person_a_id}
                </Link>
                {' & '}
                <Link to={`/staff/personnage/${p.person_b_id}/modifier`}>
                  {noms[p.person_b_id] || p.person_b_id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={verifier} style={{ marginTop: 16 }}>
        Relancer la vérification
      </button>
    </div>
  )
}

export default IncoherenceChecker