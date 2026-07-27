import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// personId présent = mode édition : la photo s'enregistre immédiatement en base
// personId absent = mode création : la photo reste en attente jusqu'à la validation du formulaire
function ImageUpload({ avatarUrl, onChange, personId }) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [confirmation, setConfirmation] = useState(false)

  async function gererFichier(e) {
    const fichier = e.target.files[0]
    if (!fichier) return

    setErreur(null)
    setConfirmation(false)

    if (!fichier.type.startsWith('image/')) {
      setErreur('Le fichier doit être une image.')
      return
    }
    if (fichier.size > 5 * 1024 * 1024) {
      setErreur("L'image ne doit pas dépasser 5 Mo.")
      return
    }

    setEnCours(true)

    const extension = fichier.name.split('.').pop()
    const nomFichier = `${personId || 'temp'}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(nomFichier, fichier, { upsert: true })

    if (uploadError) {
      setErreur('Erreur upload : ' + uploadError.message)
      setEnCours(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(nomFichier)
    const nouvelleUrl = urlData.publicUrl

    // En mode édition, on enregistre tout de suite en base, sans attendre le bouton "Enregistrer"
    if (personId) {
      const { error: updateError } = await supabase
        .from('persons')
        .update({ avatar_url: nouvelleUrl, updated_at: new Date().toISOString() })
        .eq('id', personId)

      if (updateError) {
        setErreur('Image envoyée, mais échec de l\'enregistrement : ' + updateError.message)
        setEnCours(false)
        return
      }
      setConfirmation(true)
    }

    onChange(nouvelleUrl)
    setEnCours(false)
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {avatarUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <img src={avatarUrl} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
          <button type="button" onClick={() => onChange(null)}>Retirer l'image</button>
        </div>
      ) : (
        <p className="empty" style={{ marginBottom: 8 }}>Aucune image</p>
      )}

      <input type="file" accept="image/*" onChange={gererFichier} disabled={enCours} />
      {enCours && <p>Envoi en cours...</p>}
      {confirmation && <p style={{ color: 'var(--clan-tonnerre)' }}>✅ Image enregistrée immédiatement.</p>}
      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
    </div>
  )
}

export default ImageUpload