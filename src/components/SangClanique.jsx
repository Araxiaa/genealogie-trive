import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCampColorMap } from '../lib/campColors'

function SangClanique({ personId }) {
  const [sang, setSang] = useState(null)
  const [couleurs, setCouleurs] = useState({})

  useEffect(() => {
    getCampColorMap().then(setCouleurs)

    supabase
      .rpc('calculer_sang', { p_person_id: personId })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur calcul sang clanique :', error)
          return
        }
        setSang(data)
      })
  }, [personId])

  if (!sang) return null

  const entrees = Object.entries(sang).sort((a, b) => b[1] - a[1])
  const estPur = entrees.length === 1 && entrees[0][1] === 100

  function couleurDe(nom) {
    if (nom === 'Origine inconnue') return 'var(--couleur-bordure)'
    return couleurs[nom] || 'var(--couleur-texte-discret)'
  }

  return (
    <div className="sang-clanique">
      <div className="barre-sang">
        {entrees.map(([nom, pct]) => (
          <div
            key={nom}
            className="segment-sang"
            style={{ width: `${pct}%`, background: couleurDe(nom) }}
            title={`${nom} : ${pct.toFixed(1)}%`}
          />
        ))}
      </div>
      {!estPur && (
        <div className="legende-sang">
          {entrees.map(([nom, pct]) => (
            <span key={nom} className="legende-item">
              <span className="pastille" style={{ background: couleurDe(nom) }} />
              {nom} {pct.toFixed(0)}%
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default SangClanique
