import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import PersonPicker from '../../components/PersonPicker'

function MergePersons() {
  const navigate = useNavigate()
  const [doublon, setDoublon] = useState(null)
  const [original, setOriginal] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [etapeConfirmation, setEtapeConfirmation] = useState(false)

  function reinitialiser() {
    setDoublon(null)
    setOriginal(null)
    setEtapeConfirmation(false)
    setErreur(null)
  }

  async function confirmerFusion() {
    setErreur(null)
    setEnCours(true)

    const { error } = await supabase.rpc('merge_persons', {
      source_id: doublon.id,
      target_id: original.id,
    })

    setEnCours(false)

    if (error) {
      setErreur('Erreur lors de la fusion : ' + error.message)
      return
    }

    navigate(`/personnage/${original.id}`)
  }

  const conflit = doublon && original && doublon.id === original.id

  return (
    <div className="page">
      <Link to="/staff" className="back-link">← Retour au tableau de bord</Link>
      <h1>Fusionner deux fiches en doublon</h1>

      <p style={{ color: '#a89e8f', fontSize: '0.9rem' }}>
        Le <strong>doublon</strong> sera archivé (jamais supprimé) et tous ses liens familiaux
        (parents, enfants, unions, appartenances de clan) seront transférés vers l'
        <strong>original</strong>, qui devient la fiche définitive.
      </p>

      <div className="family-section">
        <h2>1. Le doublon (fiche à archiver)</h2>
        {doublon ? (
          <div>
            <strong>{doublon.name}</strong>{' '}
            <button type="button" onClick={() => setDoublon(null)}>Changer</button>
          </div>
        ) : (
          <PersonPicker onSelect={setDoublon} />
        )}
      </div>

      <div className="family-section">
        <h2>2. L'original (fiche à conserver)</h2>
        {original ? (
          <div>
            <strong>{original.name}</strong>{' '}
            <button type="button" onClick={() => setOriginal(null)}>Changer</button>
          </div>
        ) : (
          <PersonPicker onSelect={setOriginal} excludeId={doublon?.id} />
        )}
      </div>

      {conflit && (
        <p style={{ color: 'red' }}>Le doublon et l'original ne peuvent pas être le même personnage.</p>
      )}

      {doublon && original && !conflit && !etapeConfirmation && (
        <button type="button" onClick={() => setEtapeConfirmation(true)}>
          Continuer
        </button>
      )}

      {etapeConfirmation && (
        <div className="family-section" style={{ border: '1px solid #c98a5e', borderRadius: 8, padding: 16, background: '#fdf3ea' }}>
          <h2>⚠️ Confirmation</h2>
          <p>
            Tu es sur le point de fusionner <strong>{doublon.name}</strong> dans{' '}
            <strong>{original.name}</strong>.
          </p>
          <ul>
            <li>Tous les parents/enfants/partenaires de <strong>{doublon.name}</strong> seront réattribués à <strong>{original.name}</strong></li>
            <li><strong>{doublon.name}</strong> sera archivé (masqué du site public), pas supprimé</li>
            <li>Cette action est tracée dans l'historique, mais n'est pas automatiquement réversible</li>
          </ul>

          {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

          <button type="button" onClick={confirmerFusion} disabled={enCours}>
            {enCours ? 'Fusion en cours...' : 'Confirmer la fusion'}
          </button>
          {' '}
          <button type="button" onClick={() => setEtapeConfirmation(false)} disabled={enCours}>
            Annuler
          </button>
        </div>
      )}

      {(doublon || original) && !etapeConfirmation && (
        <p>
          <button type="button" onClick={reinitialiser}>Tout réinitialiser</button>
        </p>
      )}
    </div>
  )
}

export default MergePersons