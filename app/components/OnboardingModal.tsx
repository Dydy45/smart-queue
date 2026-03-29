"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  Layers,
  Monitor,
  Globe,
  CheckCircle2,
  ArrowRight,
  X,
  Briefcase,
} from "lucide-react"

interface OnboardingModalProps {
  onClose: () => void
  onOpenSettings: () => void
}

const STEPS = [
  {
    id: 1,
    icon: <Sparkles className="w-10 h-10 text-primary" />,
    title: "Bienvenue sur SmartQueue !",
    description:
      "Vous venez de créer votre espace. En quelques minutes, vos clients pourront prendre un ticket en ligne et vous gérerez votre file d'attente en temps réel.",
    illustration: (
      <div className="flex justify-center gap-4 my-4">
        <div className="badge badge-primary badge-lg gap-1"><Monitor className="w-3 h-3" /> Gestion</div>
        <div className="badge badge-secondary badge-lg gap-1"><Globe className="w-3 h-3" /> Page publique</div>
        <div className="badge badge-accent badge-lg gap-1"><Sparkles className="w-3 h-3" /> Temps réel</div>
      </div>
    ),
    cta: "Commencer la configuration",
    skipLabel: "Je connais déjà, passer",
  },
  {
    id: 2,
    icon: <Layers className="w-10 h-10 text-primary" />,
    title: "Créez votre premier service",
    description:
      'Un service représente une activité de votre entreprise (ex : "Consultation", "Caisse 1", "Support technique"). Chaque service a sa propre file d\'attente.',
    illustration: (
      <div className="bg-base-200 rounded-xl p-4 my-4 text-sm text-left space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Donnez un nom à votre service</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Définissez un temps moyen de traitement (en minutes)</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Créez autant de services que nécessaire</span>
        </div>
      </div>
    ),
    cta: "Créer un service",
    href: "/services",
    skipLabel: "J'ai déjà un service, continuer",
  },
  {
    id: 3,
    icon: <Briefcase className="w-10 h-10 text-primary" />,
    title: "Créez votre premier poste",
    description:
      'Un poste est un point de traitement lié à un service (ex : "Guichet 1", "Cabinet Dr. Martin"). Vos employés utilisent les postes pour appeler et traiter les tickets.',
    illustration: (
      <div className="bg-base-200 rounded-xl p-4 my-4 text-sm text-left space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Associez chaque poste à un service</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Assignez des employés à des postes spécifiques</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Plusieurs postes peuvent partager le même service</span>
        </div>
      </div>
    ),
    cta: "Créer un poste",
    href: "/poste_list",
    skipLabel: "J'ai déjà un poste, continuer",
  },
  {
    id: 4,
    icon: <Globe className="w-10 h-10 text-primary" />,
    title: "Définissez votre URL publique",
    description:
      'Votre URL publique est le lien que vous donnez à vos clients pour qu\'ils prennent un ticket en ligne (ex : smartqueue.app/page/mon-cabinet). Elle est unique et ne peut pas être modifiée une fois définie.',
    illustration: (
      <div className="bg-base-200 rounded-xl p-4 my-4 text-left">
        <p className="text-xs text-base-content/50 mb-1">Exemple d&apos;URL</p>
        <p className="font-mono text-sm text-primary break-all">
          smartqueue.app/page/<span className="font-bold">mon-cabinet</span>
        </p>
      </div>
    ),
    cta: "Définir mon URL",
    isSettings: true,
    skipLabel: "J'ai déjà configuré mon URL",
  },
  {
    id: 5,
    icon: <CheckCircle2 className="w-10 h-10 text-success" />,
    title: "Vous êtes prêt !",
    description:
      "Votre espace SmartQueue est configuré. Partagez votre page publique à vos clients et commencez à gérer vos files d'attente en temps réel.",
    illustration: (
      <div className="bg-success/10 border border-success/30 rounded-xl p-4 my-4 text-sm text-left space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Service créé</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Poste créé</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>URL publique configurée</span>
        </div>
      </div>
    ),
    cta: "Accéder à mon tableau de bord",
  },
]

export default function OnboardingModal({ onClose, onOpenSettings }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleCta = () => {
    if (isLast) {
      onClose()
      return
    }
    if (current.isSettings) {
      onOpenSettings()
      return
    }
    if (!current.href) {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      onClose()
    }
  }

  const handleDismiss = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Bouton fermer discret */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-base-content"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex gap-1.5 mb-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-primary" : "bg-base-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-base-content/40 text-right">
            Étape {step + 1} sur {STEPS.length}
          </p>
        </div>

        {/* Contenu */}
        <div className="px-6 pb-6">
          <div className="flex justify-center mb-4">{current.icon}</div>

          <h2 className="text-xl font-bold text-center mb-2">{current.title}</h2>
          <p className="text-sm text-base-content/70 text-center leading-relaxed">
            {current.description}
          </p>

          {current.illustration}

          {/* CTA principal */}
          {current.href ? (
            <Link
              href={current.href}
              onClick={onClose}
              className="btn btn-primary w-full gap-2 mb-3"
            >
              {current.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={handleCta}
              className="btn btn-primary w-full gap-2 mb-3"
            >
              {current.cta}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </button>
          )}

          {/* Lien skip */}
          {!isLast && current.skipLabel && (
            <button
              onClick={handleSkip}
              className="btn btn-ghost btn-sm w-full text-base-content/50"
            >
              {current.skipLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
