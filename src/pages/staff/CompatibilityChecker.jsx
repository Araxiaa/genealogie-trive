import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import PersonPicker from '../../components/PersonPicker'

const SEUIL_MINIMUM = 3

function CompatibilityChecker() {
  const [personneA, setPersonneA] = useState(null)
  const [personneB, setPersonneB] = useState(null)
  const [resultats, setResultats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)

  async function verifier() {
    setErreur(null)
    setResultats(null)

    if (!personneA || !personneB) return
    if (personneA.id === personneB.id) {
      setErreur('Choisis deux personnages différents.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.rpc('trouver_ancetres_communs', {
      person_a: personneA.id,
      person_b: personneB.id,
    })
    setLoading(false)

    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }
    setResultats(data || [])
  }

  const ancetreProche = resultats && resultats.length > 0 ? resultats[0] : null
  const distanceMin = ancetreProche ? Math.min(ancetreProche.depth_a, ancetreProche.depth_b) : null

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Vérificateur de compatibilité</h1>
      <p style={{ color: 'var(--couleur-texte-discret)', fontSize: '0.9rem' }}>
        Règle du serveur : au moins {SEUIL_MINIMUM} générations d'écart avec le dernier ancêtre commun.
      </p>

      <div className="family-section">
        <h2>Personnage 1</h2>
        {personneA ? (
          <div><strong>{personneA.name}</strong> <button type="button" onClick={() => setPersonneA(null)}>Changer</button></div>
        ) : (
          <PersonPicker onSelect={setPersonneA} />
        )}
      </div>

      <div className="family-section">
        <h2>Personnage 2</h2>
        {personneB ? (
          <div><strong>{personneB.name}</strong> <button type="button" onClick={() => setPersonneB(null)}>Changer</button></div>
        ) : (
          <PersonPicker onSelect={setPersonneB} excludeId={personneA?.id} />
        )}
      </div>

      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

      <button type="button" onClick={verifier} disabled={!personneA || !personneB || loading}>
        {loading ? 'Vérification...' : 'Vérifier la compatibilité'}
      </button>

      {resultats && (
        <div className="family-section">
          {resultats.length === 0 ? (
            <p style={{ color: 'var(--clan-tonnerre)' }}>
              ✅ Aucun ancêtre commun connu dans les données actuelles — union possible.
            </p>
          ) : distanceMin >= SEUIL_MINIMUM ? (
            <p style={{ color: 'var(--clan-tonnerre)' }}>
              ✅ Conforme à la règle : ancêtre commun le plus proche ({ancetreProche.ancestor_name}) à {distanceMin} générations minimum de chaque côté.
            </p>
          ) : (
            <p style={{ color: 'var(--couleur-accent)' }}>
              ⚠️ Trop proche : ancêtre commun ({ancetreProche.ancestor_name}) à seulement {distanceMin} génération{distanceMin > 1 ? 's' : ''} du côté le plus court. La règle impose {SEUIL_MINIMUM} minimum.
            </p>
          )}

          {resultats.length > 0 && (
            <>
              <h2 style={{ marginTop: 20 }}>Détail des ancêtres communs trouvés</h2>
              <ul className="person-list">
                {resultats.map((r) => (
                  <li key={r.ancestor_id}>
                    {r.ancestor_name} — {r.depth_a} génération(s) côté {personneA.name}, {r.depth_b} côté {personneB.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default CompatibilityChecker