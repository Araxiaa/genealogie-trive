import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import FamilyTree from '../components/FamilyTree'
import PersonListItem from '../components/PersonListItem'
import SangClanique from '../components/SangClanique'
import { iconeRang } from '../lib/rankUtils'
import { getCampColorMap } from '../lib/campColors'

function sceauLettre(campName) {
  return campName.charAt(campName.lastIndexOf(' ') + 1)
}

async function enfantsDe(parentIds, excludeIds = []) {
  if (parentIds.length === 0) return []
  const { data, error } = await supabase
    .from('parentages')
    .select('parent_id, persons!parentages_child_id_fkey(id, name, avatar_url, dead)')
    .in('parent_id', parentIds)
    .eq('visible_dans_arbre', true)

  if (error) {
    console.error('Erreur enfantsDe :', error)
    return []
  }

  const exclus = new Set(excludeIds)
  const dejaVus = new Set()
  return (data || [])
    .filter((x) => {
      if (exclus.has(x.persons.id) || dejaVus.has(x.persons.id)) return false
      dejaVus.add(x.persons.id)
      return true
    })
    .map((x) => x.persons)
}

async function parentsDe(childIds) {
  if (childIds.length === 0) return []
  const { data, error } = await supabase
    .from('parentages')
    .select('persons!parentages_parent_id_fkey(id, name, avatar_url, dead)')
    .in('child_id', childIds)
    .eq('visible_dans_arbre', true)

  if (error) {
    console.error('Erreur parentsDe :', error)
    return []
  }

  const dejaVus = new Set()
  return (data || [])
    .filter((x) => {
      if (dejaVus.has(x.persons.id)) return false
      dejaVus.add(x.persons.id)
      return true
    })
    .map((x) => x.persons)
}

function PersonPage() {
  const { personId } = useParams()
  const [person, setPerson] = useState(null)
  const [campActuel, setCampActuel] = useState(null)
  const [couleursCamps, setCouleursCamps] = useState({})
  const [parents, setParents] = useState([])
  const [children, setChildren] = useState([])
  const [partners, setPartners] = useState([])
  const [grandparents, setGrandparents] = useState([])
  const [grandchildren, setGrandchildren] = useState([])
  const [siblings, setSiblings] = useState([])
  const [evenements, setEvenements] = useState([])
  const [loading, setLoading] = useState(true)

  const [chargementElargie, setChargementElargie] = useState(true)
  const [onclesTantes, setOnclesTantes] = useState([])
  const [cousins, setCousins] = useState([])
  const [neveuxNieces, setNeveuxNieces] = useState([])
  const [grandsOnclesTantes, setGrandsOnclesTantes] = useState([])
  const [beauxParents, setBeauxParents] = useState([])
  const [beauxFreresSoeurs, setBeauxFreresSoeurs] = useState([])
  const [exPartenaires, setExPartenaires] = useState([])

  useEffect(() => {
    getCampColorMap().then(setCouleursCamps)
  }, [])

  useEffect(() => {
    async function chargerDonnees() {
      setLoading(true)
      setChargementElargie(true)

      const { data: personData, error: personError } = await supabase
        .from('persons')
        .select('*')
        .eq('id', personId)
        .single()

      if (personError) {
        console.error('Erreur chargement personnage :', personError)
        setLoading(false)
        return
      }
      setPerson(personData)

      const { data: campData } = await supabase
        .from('clan_memberships')
        .select('camps_ref(id, name)')
        .eq('person_id', personId)
        .is('date_fin', null)
        .maybeSingle()
      setCampActuel(campData?.camps_ref || null)

      const { data: evenementsData } = await supabase
        .from('vie_evenements')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: true })
      setEvenements(evenementsData || [])

      const { data: parentsData, error: parentsError } = await supabase
        .from('parentages')
        .select('type, persons!parentages_parent_id_fkey(id, name, avatar_url, dead)')
        .eq('child_id', personId)
        .eq('visible_dans_arbre', true)
      if (parentsError) console.error('Erreur parents :', parentsError)
      setParents(parentsData || [])

      const { data: childrenData, error: childrenError } = await supabase
        .from('parentages')
        .select('type, persons!parentages_child_id_fkey(id, name, avatar_url, dead)')
        .eq('parent_id', personId)
        .eq('visible_dans_arbre', true)
      if (childrenError) console.error('Erreur enfants :', childrenError)
      setChildren(childrenData || [])

      const { data: unionsData } = await supabase
        .from('unions')
        .select('id, statut, person_a_id, person_b_id')
        .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)
        .is('date_fin', null)

      let partnersData = []
      if (unionsData && unionsData.length > 0) {
        const partnerIds = unionsData.map((u) =>
          u.person_a_id === personId ? u.person_b_id : u.person_a_id
        )
        const { data } = await supabase
          .from('persons')
          .select('id, name, avatar_url, dead')
          .in('id', partnerIds)
        partnersData = data || []
      }
      setPartners(partnersData)

      const parentIds = (parentsData || []).map((p) => p.persons.id)
      const childIds = (childrenData || []).map((c) => c.persons.id)

      let grandparentsData = []
      if (parentIds.length > 0) {
        const { data: gpData, error: gpError } = await supabase
          .from('parentages')
          .select('type, child_id, persons!parentages_parent_id_fkey(id, name, avatar_url, dead)')
          .in('child_id', parentIds)
          .eq('visible_dans_arbre', true)
        if (gpError) console.error('Erreur grands-parents :', gpError)
        grandparentsData = gpData || []
      }
      setGrandparents(grandparentsData)

      if (childIds.length > 0) {
        const { data: gcData, error: gcError } = await supabase
          .from('parentages')
          .select('type, parent_id, persons!parentages_child_id_fkey(id, name, avatar_url, dead)')
          .in('parent_id', childIds)
          .eq('visible_dans_arbre', true)
        if (gcError) console.error('Erreur petits-enfants :', gcError)
        setGrandchildren(gcData || [])
      } else {
        setGrandchildren([])
      }

      let siblingsData = []
      if (parentIds.length > 0) {
        const { data: sibData, error: sibError } = await supabase
          .from('parentages')
          .select('parent_id, persons!parentages_child_id_fkey(id, name, avatar_url, dead)')
          .in('parent_id', parentIds)
          .eq('visible_dans_arbre', true)
          .neq('child_id', personId)
        if (sibError) console.error('Erreur fratrie :', sibError)

        const parParsonne = new Map()
        ;(sibData || []).forEach((s) => {
          const existant = parParsonne.get(s.persons.id)
          if (existant) {
            existant.parentIds.push(s.parent_id)
          } else {
            parParsonne.set(s.persons.id, { persons: s.persons, parentIds: [s.parent_id] })
          }
        })
        siblingsData = Array.from(parParsonne.values())
      }
      setSiblings(siblingsData)

      setLoading(false)

      const grandparentIds = grandparentsData.map((gp) => gp.persons.id)
      const siblingIds = siblingsData.map((s) => s.persons.id)
      const partnerIds2 = partnersData.map((p) => p.id)

      const onclesTantesTrouves = await enfantsDe(grandparentIds, [...parentIds, personId])
      setOnclesTantes(onclesTantesTrouves)

      const onclesTantesIds = onclesTantesTrouves.map((p) => p.id)
      const cousinsTrouves = await enfantsDe(onclesTantesIds)
      setCousins(cousinsTrouves)

      const neveuxTrouves = await enfantsDe(siblingIds)
      setNeveuxNieces(neveuxTrouves)

      const arriereGrandsParents = await parentsDe(grandparentIds)
      const arriereGrandsParentsIds = arriereGrandsParents.map((p) => p.id)
      const grandsOnclesTrouves = await enfantsDe(arriereGrandsParentsIds, grandparentIds)
      setGrandsOnclesTantes(grandsOnclesTrouves)

      const beauxParentsTrouves = await parentsDe(partnerIds2)
      setBeauxParents(beauxParentsTrouves)

      const beauxParentsIds = beauxParentsTrouves.map((p) => p.id)
      const beauxFreresTrouves = await enfantsDe(beauxParentsIds, partnerIds2)
      setBeauxFreresSoeurs(beauxFreresTrouves)

      const { data: exUnions, error: exError } = await supabase
        .from('unions')
        .select('person_a_id, person_b_id')
        .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)
        .not('date_fin', 'is', null)

      if (exError) {
        console.error('Erreur ex-partenaires :', exError)
      } else if (exUnions && exUnions.length > 0) {
        const exIds = exUnions.map((u) => (u.person_a_id === personId ? u.person_b_id : u.person_a_id))
        const { data: exPersonsData } = await supabase
          .from('persons')
          .select('id, name, avatar_url, dead')
          .in('id', exIds)
        setExPartenaires(exPersonsData || [])
      } else {
        setExPartenaires([])
      }

      setChargementElargie(false)
    }

    chargerDonnees()
  }, [personId])

  if (loading) return <p className="page">Chargement...</p>
  if (!person) return <p className="page">Ce personnage n'existe pas.</p>

  return (
    <div className="page">
      <div className="entete-page">
        <Link to="/" className="back-link">← Retour à l'accueil</Link>
        <div className="entete-fiche" style={{ marginTop: 12 }}>
          {person.avatar_url ? (
            <img src={person.avatar_url} alt="" className="avatar-xl" />
          ) : (
            <div className="avatar-placeholder-xl">{person.name.charAt(0)}</div>
          )}
          <div>
            <div className="infos-nom">
              <h1 style={{ margin: 0 }}>
                {iconeRang(person.rank) && <span title={person.rank}>{iconeRang(person.rank)} </span>}
                {person.name}
              </h1>
              {person.dead && <span className="badge-mort">mort</span>}
            </div>
            {campActuel && (
              <p className="sous-titre" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span
                  className="sceau-clan"
                  style={{ width: 18, height: 18, fontSize: '0.65rem', background: couleursCamps[campActuel.name] || 'var(--couleur-texte-discret)' }}
                >
                  {sceauLettre(campActuel.name)}
                </span>
                {campActuel.name}
              </p>
            )}
          </div>
        </div>
        {person.description && <p className="description-fiche">{person.description}</p>}
        <SangClanique personId={person.id} />
      </div>

      <FamilyTree
        person={person}
        parents={parents.map((p) => p.persons)}
        grandparents={grandparents}
        siblings={siblings}
        partners={partners}
        children={children.map((c) => c.persons)}
        grandchildren={grandchildren}
      />

      {evenements.length > 0 && (
        <div className="family-section">
          <h2>Histoire</h2>
          <ul className="timeline-vie">
            {evenements.map((ev) => (
              <li key={ev.id}>
                {ev.date_rp && <span className="date-evenement">{ev.date_rp}</span>}
                <div className="titre-evenement">{ev.titre}</div>
                {ev.description && <div className="description-evenement">{ev.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="family-section">
        <h2>Grands-parents</h2>
        {grandparents.length === 0 ? <p className="empty">Aucun renseigné</p> : (
          <ul className="person-list">
            {grandparents.map((gp) => (
              <li key={gp.persons.id}><PersonListItem person={gp.persons} /></li>
            ))}
          </ul>
        )}
      </div>

      <div className="family-section">
        <h2>Parents</h2>
        {parents.length === 0 ? <p className="empty">Aucun renseigné</p> : (
          <ul className="person-list">
            {parents.map((p) => (
              <li key={p.persons.id}><PersonListItem person={p.persons} extra={p.type} /></li>
            ))}
          </ul>
        )}
      </div>

      <div className="family-section">
        <h2>Fratrie</h2>
        {siblings.length === 0 ? <p className="empty">Aucune renseignée</p> : (
          <ul className="person-list">
            {siblings.map((s) => (
              <li key={s.persons.id}><PersonListItem person={s.persons} /></li>
            ))}
          </ul>
        )}
      </div>

      <div className="family-section">
        <h2>Partenaire(s)</h2>
        {partners.length === 0 ? <p className="empty">Aucun renseigné</p> : (
          <ul className="person-list">
            {partners.map((p) => (
              <li key={p.id}><PersonListItem person={p} /></li>
            ))}
          </ul>
        )}
      </div>

      <div className="family-section">
        <h2>Enfants</h2>
        {children.length === 0 ? <p className="empty">Aucun renseigné</p> : (
          <ul className="person-list">
            {children.map((c) => (
              <li key={c.persons.id}><PersonListItem person={c.persons} extra={c.type} /></li>
            ))}
          </ul>
        )}
      </div>

      <div className="family-section">
        <h2>Petits-enfants</h2>
        {grandchildren.length === 0 ? <p className="empty">Aucun renseigné</p> : (
          <ul className="person-list">
            {grandchildren.map((gc) => (
              <li key={gc.persons.id}><PersonListItem person={gc.persons} /></li>
            ))}
          </ul>
        )}
      </div>

      <hr style={{ margin: '32px 0' }} />
      <p className="sous-titre" style={{ marginBottom: 16 }}>Famille élargie</p>

      {chargementElargie ? (
        <p className="empty">Chargement de la famille élargie...</p>
      ) : (
        <>
          <div className="family-section">
            <h2>Grands-oncles / Grandes-tantes</h2>
            {grandsOnclesTantes.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {grandsOnclesTantes.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>

          <div className="family-section">
            <h2>Oncles / Tantes</h2>
            {onclesTantes.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {onclesTantes.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>

          <div className="family-section">
            <h2>Cousins / Cousines</h2>
            {cousins.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {cousins.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>

          <div className="family-section">
            <h2>Neveux / Nièces</h2>
            {neveuxNieces.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {neveuxNieces.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>

          <div className="family-section">
            <h2>Beaux-parents</h2>
            {beauxParents.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {beauxParents.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>

          <div className="family-section">
            <h2>Beaux-frères / Belles-sœurs</h2>
            {beauxFreresSoeurs.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {beauxFreresSoeurs.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>

          <div className="family-section">
            <h2>Ex-partenaires</h2>
            {exPartenaires.length === 0 ? <p className="empty">Aucun renseigné</p> : (
              <ul className="person-list">
                {exPartenaires.map((p) => (
                  <li key={p.id}><PersonListItem person={p} /></li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PersonPage
