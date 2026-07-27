import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import ImageUpload from '../../components/ImageUpload'

function CreatePerson() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    person_type: 'joueur',
    gender: '',
    description: '',
    dead: false,
    avatar_url: null,
    genotype: '',
    joueur_pseudo: '',
    rank: '',
  })
  const [tousLesCamps, setTousLesCamps] = useState([])
  const [campOrigine, setCampOrigine] = useState('')
  const [motifOrigine, setMotifOrigine] = useState('Naissance')
  const [aChangeDeCam, setAChangeDeCam] = useState(false)
  const [campActuel, setCampActuel] = useState('')
  const [motifActuel, setMotifActuel] = useState('Transfert')
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    supabase
      .from('camps_ref')
      .select('id, name, actif')
      .order('ordre_affichage')
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur chargement camps :', error)
        } else {
          setTousLesCamps(data)
        }
      })
  }, [])

  const campsActifs = tousLesCamps.filter((c) => c.actif)

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

    const { data, error } = await supabase
      .from('persons')
      .insert({
        name: form.name.trim(),
        person_type: form.person_type,
        gender: form.gender || null,
        description: form.description || null,
        dead: form.dead,
        avatar_url: form.avatar_url,
        genotype: form.genotype || null,
        joueur_pseudo: form.person_type === 'joueur' ? form.joueur_pseudo || null : null,
        rank: form.rank || null,
      })
      .select()
      .single()

    if (error) {
      setEnCours(false)
      setErreur('Erreur : ' + error.message)
      return
    }

    // Gestion de l'appartenance de camp : origine seule, ou origine + actuel si différents
    if (campOrigine) {
      if (aChangeDeCam && campActuel && campActuel !== campOrigine) {
        // Le camp d'origine est déjà terminé (le personnage l'a quitté)
        const { error: origineError } = await supabase.from('clan_memberships').insert({
          person_id: data.id,
          camp_id: campOrigine,
          motif: motifOrigine || null,
          date_debut: new Date(Date.now() - 1000).toISOString(),
          date_fin: new Date().toISOString(),
        })

        if (origineError) {
          setEnCours(false)
          setErreur(
            `Le personnage a été créé, mais l'origine n'a pas pu être enregistrée : ${origineError.message}. Tu peux la corriger depuis sa fiche.`
          )
          return
        }

        const { error: actuelError } = await supabase.from('clan_memberships').insert({
          person_id: data.id,
          camp_id: campActuel,
          motif: motifActuel || null,
        })

        if (actuelError) {
          setEnCours(false)
          setErreur(
            `Le personnage a été créé avec son origine, mais le camp actuel n'a pas pu être enregistré : ${actuelError.message}. Tu peux le corriger depuis sa fiche.`
          )
          return
        }
      } else {
        // Origine et camp actuel identiques : une seule appartenance, toujours en cours
        const { error: campError } = await supabase.from('clan_memberships').insert({
          person_id: data.id,
          camp_id: campOrigine,
          motif: motifOrigine || null,
        })

        if (campError) {
          setEnCours(false)
          setErreur(
            `Le personnage a été créé, mais l'affiliation au camp a échoué : ${campError.message}. Tu peux l'ajouter manuellement depuis sa fiche.`
          )
          return
        }
      }
    }

    setEnCours(false)
    navigate(`/personnage/${data.id}`)
  }

  return (
    <div className="page">
      <h1>Créer un personnage</h1>

      <form onSubmit={soumettre}>
        <div style={{ marginBottom: 12 }}>
          <label>Image<br /></label>
          <ImageUpload avatarUrl={form.avatar_url} onChange={(url) => majChamp('avatar_url', url)} />
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
                value={form.joueur_pseudo}
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
              value={form.gender}
              onChange={(e) => majChamp('gender', e.target.value)}
              className="search-input"
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Rang<br />
            <input
              type="text"
              value={form.rank}
              onChange={(e) => majChamp('rank', e.target.value)}
              className="search-input"
              placeholder="ex: Guerrier, Chef, Lieutenant, Guérisseur..."
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Description<br />
            <textarea
              value={form.description}
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
              value={form.genotype}
              onChange={(e) => majChamp('genotype', e.target.value)}
              className="search-input"
              placeholder="ex: B/b O/o D/d..."
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={form.dead}
              onChange={(e) => majChamp('dead', e.target.checked)}
            />
            {' '}Décédé(e)
          </label>
        </div>

        <hr style={{ margin: '20px 0' }} />

        <div style={{ marginBottom: 12 }}>
          <label>Origine (clan/groupe de naissance, actif ou dissous)<br />
            <select value={campOrigine} onChange={(e) => setCampOrigine(e.target.value)}>
              <option value="">— Non renseignée —</option>
              {tousLesCamps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}{!camp.actif ? ' (dissous)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {campOrigine && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label>Motif de l'origine<br />
                <input
                  type="text"
                  value={motifOrigine}
                  onChange={(e) => setMotifOrigine(e.target.value)}
                  className="search-input"
                />
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>
                <input
                  type="checkbox"
                  checked={aChangeDeCam}
                  onChange={(e) => setAChangeDeCam(e.target.checked)}
                />
                {' '}A changé de camp depuis son origine
              </label>
            </div>

            {aChangeDeCam && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label>Camp actuel<br />
                    <select value={campActuel} onChange={(e) => setCampActuel(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {campsActifs.map((camp) => (
                        <option key={camp.id} value={camp.id}>{camp.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Motif du changement<br />
                    <input
                      type="text"
                      value={motifActuel}
                      onChange={(e) => setMotifActuel(e.target.value)}
                      className="search-input"
                    />
                  </label>
                </div>
              </>
            )}
          </>
        )}

        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

        <button type="submit" disabled={enCours}>
          {enCours ? 'Création...' : 'Créer le personnage'}
        </button>
      </form>
    </div>
  )
}

export default CreatePerson
