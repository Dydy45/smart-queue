'use client'

import { useEffect } from 'react'

interface CompanyThemeProviderProps {
  primaryColor?: string | null
  accentColor?: string | null
  logoUrl?: string | null
  companyName?: string | null
  description?: string | null
  children: React.ReactNode
}

/**
 * Injecte les CSS custom properties du thème de l'entreprise
 * sur les pages publiques. Utilise les couleurs DaisyUI par défaut
 * si aucun thème personnalisé n'est défini.
 */
export default function CompanyThemeProvider({
  primaryColor,
  accentColor,
  logoUrl,
  companyName,
  description,
  children,
}: CompanyThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement

    if (primaryColor) {
      root.style.setProperty('--company-primary', primaryColor)
      root.style.setProperty('--p', hexToHSL(primaryColor))
    }
    if (accentColor) {
      root.style.setProperty('--company-accent', accentColor)
      root.style.setProperty('--a', hexToHSL(accentColor))
    }

    return () => {
      root.style.removeProperty('--company-primary')
      root.style.removeProperty('--company-accent')
      root.style.removeProperty('--p')
      root.style.removeProperty('--a')
    }
  }, [primaryColor, accentColor])

  return (
    <div>
      {/* En-tête branded */}
      {(logoUrl || companyName) && (
        <div className="flex flex-col items-center gap-2 mb-6">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={companyName || 'Logo entreprise'}
              className="h-16 w-auto object-contain rounded-lg"
            />
          )}
          {companyName && (
            <h2
              className="text-xl font-bold"
              style={primaryColor ? { color: primaryColor } : undefined}
            >
              {companyName}
            </h2>
          )}
          {description && (
            <p className="text-sm text-base-content/60 text-center max-w-md">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * Convertit un code hex (#RRGGBB) en valeur HSL (H S% L%)
 * compatible avec les CSS variables DaisyUI.
 */
function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
