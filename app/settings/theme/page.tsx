'use client'

import { useEffect, useState } from 'react'
import { Palette, Save, Loader2, Eye, Image } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper'
import { getMyCompanyTheme, updateCompanyTheme } from '@/app/actions/theme'

export default function ThemeSettingsPage() {
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6419E6')
  const [accentColor, setAccentColor] = useState('#D926A9')
  const [description, setDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const theme = await getMyCompanyTheme()
        setCompanyName(theme.name)
        setLogoUrl(theme.logoUrl)
        setPrimaryColor(theme.primaryColor || '#6419E6')
        setAccentColor(theme.accentColor || '#D926A9')
        setDescription(theme.description)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await updateCompanyTheme({
      logoUrl: logoUrl.trim() || undefined,
      primaryColor: primaryColor || undefined,
      accentColor: accentColor || undefined,
      description: description.trim() || undefined,
    })

    setIsSaving(false)

    if (result.success) {
      setSuccess('Thème enregistré avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Erreur lors de la sauvegarde')
    }
  }

  const handleReset = () => {
    setPrimaryColor('#6419E6')
    setAccentColor('#D926A9')
    setLogoUrl('')
    setDescription('')
  }

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Palette className="w-6 h-6" />
        Personnalisation du thème
      </h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-ghost btn-xs">✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Configuration</h2>

            <div className="space-y-4">
              {/* Logo URL */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text flex items-center gap-1">
                    <Image className="w-4 h-4" /> URL du logo
                  </span>
                </div>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://exemple.com/logo.png"
                  className="input input-bordered"
                  maxLength={500}
                />
                <div className="label">
                  <span className="label-text-alt">Image PNG, JPG ou SVG (URL directe)</span>
                </div>
              </label>

              {/* Couleur principale */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Couleur principale</span>
                  <span className="label-text-alt font-mono text-xs">{primaryColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border-0"
                    aria-label="Sélecteur couleur principale"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    placeholder="#6419E6"
                    className="input input-bordered input-sm flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </label>

              {/* Couleur d'accent */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Couleur d&apos;accent</span>
                  <span className="label-text-alt font-mono text-xs">{accentColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border-0"
                    aria-label="Sélecteur couleur accent"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    placeholder="#D926A9"
                    className="input input-bordered input-sm flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </label>

              {/* Description */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Description de l&apos;entreprise</span>
                </div>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Une courte description affichée sur vos pages publiques..."
                  className="textarea textarea-bordered"
                  maxLength={300}
                  rows={3}
                />
                <div className="label">
                  <span className="label-text-alt">{description.length}/300</span>
                </div>
              </label>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleReset}
                  className="btn btn-ghost btn-sm"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary flex-1 gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              Prévisualisation
            </h2>

            <div className="bg-base-100 rounded-xl p-6 border border-base-300">
              {/* Header preview */}
              <div className="flex flex-col items-center gap-3 mb-6">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-14 w-auto object-contain rounded-lg"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-base-300 flex items-center justify-center text-base-content/30 text-xs">
                    Logo
                  </div>
                )}
                <h3 className="text-lg font-bold" style={{ color: primaryColor }}>
                  {companyName || 'Nom de votre entreprise'}
                </h3>
                {description && (
                  <p className="text-sm text-base-content/60 text-center">{description}</p>
                )}
              </div>

              {/* Boutons preview */}
              <div className="space-y-3">
                <button
                  className="btn w-full text-white"
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                  Bouton principal
                </button>
                <button
                  className="btn btn-outline w-full"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Bouton secondaire
                </button>
                <button
                  className="btn w-full text-white"
                  style={{ backgroundColor: accentColor, borderColor: accentColor }}
                >
                  Bouton accent
                </button>
              </div>

              {/* Badge preview */}
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                <span
                  className="badge text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  En attente
                </span>
                <span
                  className="badge text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  Confirmé
                </span>
                <span className="badge badge-ghost">Annulé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
