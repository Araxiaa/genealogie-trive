import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getCampColorMap } from '../lib/campColors'

function compterFamilles(personIds, liens) {
  const parent = new Map()
  personIds.forEach((id) => parent.set(id, id))

  function trouver(id) {
    if (!parent.has(id)) return id
    if (parent.get(id) === id) return id
    const racine = trouver(parent.get(id))
    parent.set(id, racine)
    return racine
  }

  function unir(a, b) {
    const racineA = trouver(a)
    const racineB = trouver(b)
    if (racineA !== racineB) parent.set(racineA, racineB)
  }

  liens.forEach(([a, b]) => {
    if (parent.has(a) && parent.has(b)) unir(a, b)
  })

  const racines = new Set(personIds.map((id) => trouver(id)))
  return racines.size
}

function Informations() {
  const [statsParCamp, setStatsParCamp] = useState([])
  const [couleurs, setCouleurs] = useState({})
  const [nbFamilles, setNbFamilles] = useState(null)
  const [repartitionType, setRepartitionType] = useState({ joueur: 0, pnj: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerInformations()
  }, [])

  async function chargerInformations() {
    setLoading(true)

    const couleursMap = await getCampColorMap()
    setCouleurs(couleursMap)

    const { data: statsData, error: statsError } = await supabase
      .from('v_stats_par_camp')
      .select('*')
    if (statsError) console.error('Erreur stats par camp :', statsError)
    setStatsParCamp(statsData || [])

    const { data: personsData } = await supabase
      .from('persons')
      .select('id, person_type')
      .eq('archived', false)

    const repartition = { joueur: 0, pnj: 0 }
    ;(personsData || []).forEach((p) => {
      if (p.person_type === 'joueur') repartition.joueur++
      else repartition.pnj++
    })
    setRepartitionType(repartition)

    const personIds = (personsData || []).map((p) => p.id)

    const [{ data: parentagesData }, { data: unionsData }] = await Promise.all([
      supabase.from('parentages').select('child_id, parent_id'),
      supabase.from('unions').select('person_a_id, person_b_id'),
    ])

    const liens = [
      ...(parentagesData || []).map((p) => [p.child_id, p.parent_id]),
      ...(unionsData || []).map((u) => [u.person_a_id, u.person_b_id]),
    ]

    setNbFamilles(compterFamilles(personIds, liens))
    setLoading(false)
  }

  if (loading) return <p className="page">Chargement des informations...</p>

  const totalPersonnes = repartitionType.joueur + repartitionType.pnj
  const pctJoueurs = totalPersonnes > 0 ? Math.round((repartitionType.joueur / totalPersonnes) * 100) : 0

  return (
    <div className="page">
      <div className="entete-page">
        <Link to="/" className="back-link">← Retour à l'accueil</Link>
        <p className="sous-titre">Coup d'œil sur le registre</p>
        <h1>Informations</h1>
      </div>

      <div className="family-section">
        <h2>Nombre de familles distinctes</h2>
        <p className="stat-valeur" style={{ fontSize: '2.5rem' }}>{nbFamilles}</p>
        <p className="empty">
          Groupes de personnages reliés entre eux par au moins un lien de parenté ou d'union — deux personnages
          sans aucun lien direct ou indirect appartiennent à deux familles différentes.
        </p>
      </div>

      <div className="family-section">
        <h2>Répartition Joueurs / PNJ</h2>
        <div className="barre-sang">
          <div className="segment-sang" style={{ width: `${pctJoueurs}%`, background: 'var(--couleur-accent)' }} title={`Joueurs : ${repartitionType.joueur}`} />
          <div className="segment-sang" style={{ width: `${100 - pctJoueurs}%`, background: 'var(--couleur-texte-discret)' }} title={`PNJ : ${repartitionType.pnj}`} />
        </div>
        <div className="legende-sang">
          <span className="legende-item"><span className="pastille" style={{ background: 'var(--couleur-accent)' }} />Joueurs : {repartitionType.joueur}</span>
          <span className="legende-item"><span className="pastille" style={{ background: 'var(--couleur-texte-discret)' }} />PNJ : {repartitionType.pnj}</span>
        </div>
      </div>

      <div className="family-section">
        <h2>Croisement de sang par camp</h2>
        {statsParCamp.length === 0 ? (
          <p className="empty">Pas encore assez de données.</p>
        ) : (
          <ul className="person-list">
            {statsParCamp.map((s) => {
              const pct = s.nb_total > 0 ? Math.round((s.nb_sang_mele / s.nb_total) * 100) : 0
              const couleurCamp = couleurs[s.camp_name] || 'var(--couleur-texte-discret)'
              return (
                <li key={s.camp_id} style={{ display: 'block', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="sceau-clan" style={{ width: 22, height: 22, fontSize: '0.7rem', background: couleurCamp }}>
                      {s.camp_name.charAt(s.camp_name.lastIndexOf(' ') + 1)}
                    </span>
                    <strong>{s.camp_name}</strong>
                    <span className="meta-extra">{s.nb_sang_mele} / {s.nb_total} membres au sang mélangé ({pct}%)</span>
                  </div>
                  <div className="barre-sang">
                    <div className="segment-sang" style={{ width: `${pct}%`, background: couleurCamp }} />
                    <div className="segment-sang" style={{ width: `${100 - pct}%`, background: 'var(--couleur-bordure)' }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Informations
