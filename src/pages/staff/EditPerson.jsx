import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import PersonPicker from '../../components/PersonPicker'
import ImageUpload from '../../components/ImageUpload'

function EditPerson() {
  const { personId } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [loading, setLoading] = useState(true)

  const [parents, setParents] = useState([])
  const [children, setChildren] = useState([])
  const [unions, setUnions] = useState([])

  const [nouveauParent, setNouveauParent] = useState(null)
  const [typeParent, setTypeParent] = useState('biologique')
  const [visibleParent, setVisibleParent] = useState(true)

  const [nouvelEnfant, setNouvelEnfant] = useState(null)
  const [typeEnfant, setTypeEnfant] = useState('biologique')
  const [visibleEnfant, setVisibleEnfant] = useState(true)

  const [nouveauPartenaire, setNouveauPartenaire] = useState(null)
  const [statutUnion, setStatutUnion] = useState('officielle')

  const [erreurFamille, setErreurFamille] = useState(null)

  const [notes, setNotes] = useState([])
  const [nouvelleNote, setNouvelleNote] = useState('')

  const [evenements, setEvenements] = useState([])
  const [nouvelEvenement, setNouvelEvenement] = useState({ titre: '', date_rp: '', description: '' })

  const [historiqueCamps, setHistoriqueCamps] = useState([])
  const [tousLesCamps, setTousLesCamps] = useState([])
  const [nouveauCamp, setNouveauCamp] = useState('')
  const [motifNouveauCamp, setMotifNouveauCamp] = useState('Transfert')
  const [erreurCamp, setErreurCamp] = useState(null)

  const [confirmationSuppression, setConfirmationSuppression] = useState('')
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [erreurSuppression, setErreurSuppression] = useState(null)

  async function chargerFamille() {
    const { data: parentsData } = await supabase
      .from('parentages')
      .select('id, type, visible_dans_arbre, persons!parentages_parent_id_fkey(id, name, dead)')
      .eq('child_id', personId)
    setParents(parentsData || [])

    const { data: childrenData } = await supabase
      .from('parentages')
      .select('id, type, visible_dans_arbre, persons!parentages_child_id_fkey(id, name, dead)')
      .eq('parent_id', personId)
    setChildren(childrenData || [])

    const { data: unionsData } = await supabase
      .from('unions')
      .select(
        'id, statut, date_fin, person_a_id, person_b_id, personA:persons!unions_person_a_id_fkey(id, name), personB:persons!unions_person_b_id_fkey(id, name)'
      )
      .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)
    setUnions(unionsData || [])
  }

  async function chargerNotes() {
    const { data } = await supabase
      .from('person_notes')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })
    setNotes(data || [])
  }

  async function chargerEvenements() {
    const { data } = await supabase
      .from('vie_evenements')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: true })
    setEvenements(data || [])
  }

  async function chargerCamps() {
    const { data } = await supabase
      .from('clan_memberships')
      .select('id, date_debut, date_fin, motif, camps_ref(id, name, actif)')
      .eq('person_id', personId)
      .order('date_debut', { ascending: true })
    setHistoriqueCamps(data || [])

    const { data: campsData } = await supabase
      .from('camps_ref')
      .select('id, name, actif')
      .order('ordre_affichage')
    setTousLesCamps(campsData || [])
  }

  useEffect(() => {
    setLoading(true)
    supabase
      .from('persons')
      .select('*')
      .eq('id', personId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setErreur('Personnage introuvable.')
        } else {
          setForm(data)
        }
        setLoading(false)
      })
    chargerFamille()
    chargerNotes()
    chargerEvenements()
    chargerCamps()
  }, [personId])

  function majChamp(champ, valeur) {
    setForm((prev) => ({ ...prev, [champ]: valeur }))
  }

  async function soumettre(e) {
    e.preventDefault()
    setErreur(null)

    if (!form.name.trim()) {
      setErreur('Le nom est obligatoire.')
      return
    }

    setEnCours(true)
    const { error } = await supabase
      .from('persons')
      .update({
        name: form.name.trim(),
        person_type: form.person_type,
        gender: form.gender || null,
        description: form.description || null,
        dead: form.dead,
        missing: form.missing,
        afterlife: form.afterlife || null,
        archived: form.archived,
        avatar_url: form.avatar_url,
        genotype: form.genotype || null,
        rank: form.rank || null,
        joueur_pseudo: form.person_type === 'joueur' ? form.joueur_pseudo || null : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', personId)

    setEnCours(false)

    if (error) {
      setErreur('Erreur : ' + error.message)
      return
    }

    navigate(`/personnage/${personId}`)
  }

  async function ajouterParent() {
    setErreurFamille(null)
    if (!nouveauParent) return

    const { error } = await supabase.from('parentages').insert({
      child_id: personId,
      parent_id: nouveauParent.id,
      type: typeParent,
      visible_dans_arbre: visibleParent,
    })

    if (error) {
      setErreurFamille('Erreur : ' + error.message)
      return
    }
    setNouveauParent(null)
    chargerFamille()
  }

  async function retirerParentage(parentageId) {
    if (!confirm('Retirer ce lien de parenté ?')) return
    const { error } = await supabase.from('parentages').delete().eq('id', parentageId)
    if (error) {
      setErreurFamille('Erreur : ' + error.message)
      return
    }
    chargerFamille()
  }

  async function ajouterEnfant() {
    setErreurFamille(null)
    if (!nouvelEnfant) return

    const { error } = await supabase.from('parentages').insert({
      child_id: nouvelEnfant.id,
      parent_id: personId,
      type: typeEnfant,
      visible_dans_arbre: visibleEnfant,
    })

    if (error) {
      setErreurFamille('Erreur : ' + error.message)
      return
    }
    setNouvelEnfant(null)
    chargerFamille()
  }

  async function ajouterPartenaire() {
    setErreurFamille(null)
    if (!nouveauPartenaire) return

    const { error } = await supabase.from('unions').insert({
      person_a_id: personId,
      person_b_id: nouveauPartenaire.id,
      statut: statutUnion,
    })

    if (error) {
      setErreurFamille('Erreur : ' + error.message)
      return
    }
    setNouveauPartenaire(null)
    chargerFamille()
  }

  async function terminerUnion(unionId) {
    if (!confirm('Marquer cette union comme terminée (rupture) ?')) return
    const { error } = await supabase
      .from('unions')
      .update({ date_fin: new Date().toISOString() })
      .eq('id', unionId)
    if (error) {
      setErreurFamille('Erreur : ' + error.message)
      return
    }
    chargerFamille()
  }

  async function ajouterNote() {
    if (!nouvelleNote.trim()) return
    const { error } = await supabase.from('person_notes').insert({
      person_id: personId,
      note: nouvelleNote.trim(),
    })
    if (error) {
      alert('Erreur : ' + error.message)
      return
    }
    setNouvelleNote('')
    chargerNotes()
  }

  async function supprimerNote(noteId) {
    if (!confirm('Supprimer cette note ?')) return
    const { error } = await supabase.from('person_notes').delete().eq('id', noteId)
    if (error) {
      alert('Erreur : ' + error.message)
      return
    }
    chargerNotes()
  }

  async function ajouterEvenement() {
    if (!nouvelEvenement.titre.trim()) return
    const { error } = await supabase.from('vie_evenements').insert({
      person_id: personId,
      titre: nouvelEvenement.titre.trim(),
      date_rp: nouvelEvenement.date_rp.trim() || null,
      description: nouvelEvenement.description.trim() || null,
    })
    if (error) {
      alert('Erreur : ' + error.message)
      return
    }
    setNouvelEvenement({ titre: '', date_rp: '', description: '' })
    chargerEvenements()
  }

  async function supprimerEvenement(evenementId) {
    if (!confirm('Supprimer cet événement ?')) return
    const { error } = await supabase.from('vie_evenements').delete().eq('id', evenementId)
    if (error) {
      alert('Erreur : ' + error.message)
      return
    }
    chargerEvenements()
  }

  async function changerCamp() {
    setErreurCamp(null)
    if (!nouveauCamp) return

    const campEnCours = historiqueCamps.find((h) => !h.date_fin)

    if (campEnCours) {
      const { error: closeError } = await supabase
        .from('clan_memberships')
        .update({ date_fin: new Date().toISOString() })
        .eq('id', campEnCours.id)

      if (closeError) {
        setErreurCamp('Erreur : ' + closeError.message)
        return
      }
    }

    const { error: insertError } = await supabase.from('clan_memberships').insert({
      person_id: personId,
      camp_id: nouveauCamp,
      motif: motifNouveauCamp || null,
    })

    if (insertError) {
      setErreurCamp('Erreur : ' + insertError.message)
      return
    }

    setNouveauCamp('')
    setMotifNouveauCamp('Transfert')
    chargerCamps()
  }

  async function supprimerDefinitivement() {
    if (confirmationSuppression !== form.name) return

    setSuppressionEnCours(true)
    setErreurSuppression(null)

    const { error } = await supabase.from('persons').delete().eq('id', personId)

    setSuppressionEnCours(false)

    if (error) {
      setErreurSuppression('Erreur : ' + error.message)
      return
    }

    navigate('/staff/personnages')
  }

  if (loading) return <p className="page">Chargement...</p>
  if (erreur && !form) return <p className="page">{erreur}</p>

  const campActuel = historiqueCamps.find((h) => !h.date_fin)
  const campsActifs = tousLesCamps.filter((c) => c.actif)
  const aDesLiens = parents.length > 0 || children.length > 0 || unions.length > 0

  return (
    <div className="page">
      <Link to="/staff/personnages" className="back-link">← Retour à la liste</Link>
      <h1>Modifier {form.name}</h1>

      <form onSubmit={soumettre}>
        <div style={{ marginBottom: 12 }}>
          <label>Image<br /></label>
          <ImageUpload
            avatarUrl={form.avatar_url}
            onChange={(url) => majChamp('avatar_url', url)}
            personId={personId}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Nom *<br />
            <input
              type="text"
              value={form.name}
              onChange={(e) => majChamp('name', e.target.value)}
              className="search-input"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Type<br />
            <select value={form.person_type} onChange={(e) => majChamp('person_type', e.target.value)}>
              <option value="joueur">Joueur</option>
              <option value="pnj">PNJ</option>
            </select>
          </label>
        </div>

        {form.person_type === 'joueur' && (
          <div style={{ marginBottom: 12 }}>
            <label>Pseudo du joueur<br />
              <input
                type="text"
                value={form.joueur_pseudo || ''}
                onChange={(e) => majChamp('joueur_pseudo', e.target.value)}
                className="search-input"
                placeholder="ex: .araxia."
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>Genre<br />
            <input
              type="text"
              value={form.gender || ''}
              onChange={(e) => majChamp('gender', e.target.value)}
              className="search-input"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Rang<br />
            <input
              type="text"
              value={form.rank || ''}
              onChange={(e) => majChamp('rank', e.target.value)}
              className="search-input"
              placeholder="ex: Guerrier, Chef, Lieutenant, Guérisseur..."
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Description<br />
            <textarea
              value={form.description || ''}
              onChange={(e) => majChamp('description', e.target.value)}
              rows={4}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Génotype (texte libre)<br />
            <input
              type="text"
              value={form.genotype || ''}
              onChange={(e) => majChamp('genotype', e.target.value)}
              className="search-input"
              placeholder="ex: B/b O/o D/d..."
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <input type="checkbox" checked={form.dead} onChange={(e) => majChamp('dead', e.target.checked)} />
            {' '}Décédé(e)
          </label>
        </div>

        {form.dead && (
          <div style={{ marginBottom: 12 }}>
            <label>Destination (StarClan / Forêt Sombre / Purgatoire...)<br />
              <input
                type="text"
                value={form.afterlife || ''}
                onChange={(e) => majChamp('afterlife', e.target.value)}
                className="search-input"
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>
            <input type="checkbox" checked={form.missing} onChange={(e) => majChamp('missing', e.target.checked)} />
            {' '}Disparu(e)
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <input type="checkbox" checked={form.archived} onChange={(e) => majChamp('archived', e.target.checked)} />
            {' '}Archivé (masqué du site public, ex: doublon)
          </label>
        </div>

        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

        <button type="submit" disabled={enCours}>
          {enCours ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      <hr style={{ margin: '32px 0' }} />

      <div className="family-section">
        <h2>Camp / historique</h2>
        {historiqueCamps.length === 0 ? (
          <p className="empty">Aucune appartenance renseignée (ni origine, ni camp actuel).</p>
        ) : (
          <ul className="person-list">
            {historiqueCamps.map((h, i) => (
              <li key={h.id}>
                {i === 0 ? '🏳️ Origine : ' : ''}
                {h.camps_ref.name}{!h.camps_ref.actif ? ' (dissous)' : ''}
                {h.motif ? ` — ${h.motif}` : ''}
                {!h.date_fin && <strong> (actuel)</strong>}
              </li>
            ))}
          </ul>
        )}

        {erreurCamp && <p style={{ color: 'red' }}>{erreurCamp}</p>}

        <label>{campActuel ? 'Changer de camp' : 'Définir le premier camp (origine)'}<br />
          <select value={nouveauCamp} onChange={(e) => setNouveauCamp(e.target.value)}>
            <option value="">— Choisir —</option>
            {(campActuel ? campsActifs : tousLesCamps).map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name}{!camp.actif ? ' (dissous)' : ''}
              </option>
            ))}
          </select>
        </label>
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <label>Motif<br />
            <input
              type="text"
              className="search-input"
              value={motifNouveauCamp}
              onChange={(e) => setMotifNouveauCamp(e.target.value)}
              placeholder={campActuel ? 'ex: Transfert, Exil...' : 'ex: Naissance'}
            />
          </label>
        </div>
        <button type="button" onClick={changerCamp} disabled={!nouveauCamp}>
          {campActuel ? 'Valider le changement de camp' : 'Définir ce camp'}
        </button>
      </div>

      <hr style={{ margin: '32px 0' }} />
      {erreurFamille && <p style={{ color: 'red' }}>{erreurFamille}</p>}

      <div className="family-section">
        <h2>Parents</h2>
        <ul className="person-list">
          {parents.map((p) => (
            <li key={p.id}>
              {p.persons.name} ({p.type}{!p.visible_dans_arbre && ", masqué de l'arbre"})
              {' '}<button type="button" onClick={() => retirerParentage(p.id)}>Retirer</button>
            </li>
          ))}
        </ul>
        <PersonPicker onSelect={setNouveauParent} excludeId={personId} />
        <select value={typeParent} onChange={(e) => setTypeParent(e.target.value)}>
          <option value="biologique">Biologique</option>
          <option value="adoptif">Adoptif</option>
        </select>
        <label>
          <input type="checkbox" checked={visibleParent} onChange={(e) => setVisibleParent(e.target.checked)} />
          {' '}Visible dans l'arbre (décoche pour une mère porteuse par ex.)
        </label>
        <button type="button" onClick={ajouterParent} disabled={!nouveauParent}>Ajouter ce parent</button>
      </div>

      <div className="family-section">
        <h2>Partenaires / Unions</h2>
        <ul className="person-list">
          {unions.map((u) => {
            const autre = u.person_a_id === personId ? u.personB : u.personA
            return (
              <li key={u.id}>
                {autre.name} ({u.statut}{u.date_fin ? ', terminée' : ''})
                {!u.date_fin && (
                  <button type="button" onClick={() => terminerUnion(u.id)}>Marquer comme terminée</button>
                )}
              </li>
            )
          })}
        </ul>
        <PersonPicker onSelect={setNouveauPartenaire} excludeId={personId} />
        <select value={statutUnion} onChange={(e) => setStatutUnion(e.target.value)}>
          <option value="officielle">Officielle</option>
          <option value="officieuse">Officieuse</option>
        </select>
        <button type="button" onClick={ajouterPartenaire} disabled={!nouveauPartenaire}>Ajouter cette union</button>
      </div>

      <div className="family-section">
        <h2>Enfants</h2>
        <ul className="person-list">
          {children.map((c) => (
            <li key={c.id}>
              {c.persons.name} ({c.type}{!c.visible_dans_arbre && ", masqué de l'arbre"})
              {' '}<button type="button" onClick={() => retirerParentage(c.id)}>Retirer</button>
            </li>
          ))}
        </ul>
        <PersonPicker onSelect={setNouvelEnfant} excludeId={personId} />
        <select value={typeEnfant} onChange={(e) => setTypeEnfant(e.target.value)}>
          <option value="biologique">Biologique</option>
          <option value="adoptif">Adoptif</option>
        </select>
        <label>
          <input type="checkbox" checked={visibleEnfant} onChange={(e) => setVisibleEnfant(e.target.checked)} />
          {' '}Visible dans l'arbre
        </label>
        <button type="button" onClick={ajouterEnfant} disabled={!nouvelEnfant}>Ajouter cet enfant</button>
      </div>

      <hr style={{ margin: '32px 0' }} />

      <div className="family-section">
        <h2>🔒 Notes internes (staff uniquement, jamais publiques)</h2>
        {notes.length === 0 ? (
          <p className="empty">Aucune note pour l'instant.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="note-item">
              {n.note}
              <span className="meta-extra">
                {new Date(n.created_at).toLocaleDateString('fr-FR')}
                {' — '}
                <button type="button" onClick={() => supprimerNote(n.id)}>Supprimer</button>
              </span>
            </div>
          ))
        )}
        <textarea
          value={nouvelleNote}
          onChange={(e) => setNouvelleNote(e.target.value)}
          rows={3}
          style={{ width: '100%', marginTop: 8 }}
          placeholder="Ajouter une note interne..."
        />
        <button type="button" onClick={ajouterNote} disabled={!nouvelleNote.trim()}>Ajouter la note</button>
      </div>

      <div className="family-section">
        <h2>Événements de vie (visibles publiquement)</h2>
        {evenements.length === 0 ? (
          <p className="empty">Aucun événement pour l'instant.</p>
        ) : (
          <ul className="timeline-vie" style={{ marginBottom: 16 }}>
            {evenements.map((ev) => (
              <li key={ev.id}>
                {ev.date_rp && <span className="date-evenement">{ev.date_rp}</span>}
                <div className="titre-evenement">{ev.titre}</div>
                {ev.description && <div className="description-evenement">{ev.description}</div>}
                <button type="button" onClick={() => supprimerEvenement(ev.id)}>Supprimer</button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginBottom: 8 }}>
          <label>Titre *<br />
            <input
              type="text"
              className="search-input"
              value={nouvelEvenement.titre}
              onChange={(e) => setNouvelEvenement((p) => ({ ...p, titre: e.target.value }))}
              placeholder="ex: Rejoint le Clan du Tonnerre"
            />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Date RP (libre)<br />
            <input
              type="text"
              className="search-input"
              value={nouvelEvenement.date_rp}
              onChange={(e) => setNouvelEvenement((p) => ({ ...p, date_rp: e.target.value }))}
              placeholder="ex: Lune de la Feuille Rousse, An 3"
            />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Description<br />
            <textarea
              value={nouvelEvenement.description}
              onChange={(e) => setNouvelEvenement((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <button type="button" onClick={ajouterEvenement} disabled={!nouvelEvenement.titre.trim()}>
          Ajouter l'événement
        </button>
      </div>

      <hr style={{ margin: '32px 0' }} />

      <div className="family-section" style={{ border: '1px solid #c0392b', borderRadius: 8, padding: 16 }}>
        <h2 style={{ color: '#c0392b' }}>⚠️ Zone de suppression définitive</h2>
        <p style={{ fontSize: '0.9rem' }}>
          Contrairement à l'archivage, cette action est <strong>irréversible</strong> et supprime le personnage
          de la base de données. Tous ses liens de parenté, unions et appartenances de camp seront supprimés
          avec lui — les autres personnages qui lui étaient liés perdront ce lien.
        </p>
        {aDesLiens && (
          <p style={{ color: '#c0392b', fontSize: '0.9rem' }}>
            Ce personnage a des liens familiaux actifs ({parents.length} parent(s), {children.length} enfant(s),
            {' '}{unions.length} union(s)). Si tu veux seulement le masquer sans casser ces liens, utilise plutôt
            la case "Archivé" plus haut.
          </p>
        )}
        <p style={{ fontSize: '0.9rem' }}>
          Pour confirmer, tape exactement le nom <strong>{form.name}</strong> ci-dessous :
        </p>
        <input
          type="text"
          className="search-input"
          value={confirmationSuppression}
          onChange={(e) => setConfirmationSuppression(e.target.value)}
          placeholder={form.name}
        />
        {erreurSuppression && <p style={{ color: 'red' }}>{erreurSuppression}</p>}
        <button
          type="button"
          onClick={supprimerDefinitivement}
          disabled={confirmationSuppression !== form.name || suppressionEnCours}
          style={{ marginTop: 8, background: '#c0392b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4 }}
        >
          {suppressionEnCours ? 'Suppression...' : 'Supprimer définitivement'}
        </button>
      </div>
    </div>
  )
}

export default EditPerson