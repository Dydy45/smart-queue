"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X } from "lucide-react"
import { getSetupStatus } from "../actions"

const DISMISSED_KEY = "sq_checklist_dismissed"

interface SetupChecklistProps {
  email: string
  pageName: string | null
}

interface Counts {
  servicesCount: number
  postesCount: number
  staffCount: number
}

export default function SetupChecklist({ email, pageName }: SetupChecklistProps) {
  const [counts, setCounts] = useState<Counts | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [hiding, setHiding] = useState(false)

  const load = useCallback(async () => {
    const data = await getSetupStatus(email)
    if (data) {
      setCounts({
        servicesCount: data.servicesCount,
        postesCount: data.postesCount,
        staffCount: data.staffCount,
      })
    }
  }, [email])

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) {
      setVisible(false)
      return
    }
    load()
  }, [load])

  // Rafraîchir quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [load])

  // Mise à jour quand pageName change (settings modal fermé)
  useEffect(() => {
    if (counts !== null) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageName])

  const steps = counts
    ? [
        {
          label: "URL publique définie",
          done: !!pageName,
          action: (
            <button
              className="btn btn-xs btn-primary btn-outline"
              onClick={() =>
                (document.getElementById("my_modal_3") as HTMLDialogElement)?.showModal()
              }
            >
              Configurer
            </button>
          ),
        },
        {
          label: "Premier service créé",
          done: counts.servicesCount > 0,
          action: (
            <Link href="/services" className="btn btn-xs btn-primary btn-outline">
              Configurer
            </Link>
          ),
        },
        {
          label: "Premier poste créé",
          done: counts.postesCount > 0,
          action: (
            <Link href="/poste_list" className="btn btn-xs btn-primary btn-outline">
              Configurer
            </Link>
          ),
        },
        {
          label: "Premier employé ajouté",
          done: counts.staffCount > 0,
          action: (
            <Link href="/staff" className="btn btn-xs btn-primary btn-outline">
              Configurer
            </Link>
          ),
        },
      ]
    : []

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === 4

  // Masquer automatiquement quand tout est fait
  useEffect(() => {
    if (!allDone || steps.length === 0) return
    const timer = setTimeout(() => {
      setHiding(true)
      setTimeout(() => setVisible(false), 350)
    }, 2500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setHiding(true)
    setTimeout(() => setVisible(false), 350)
  }

  if (!visible || !counts) return null

  return (
    <div
      className={`card bg-base-200 border border-base-300 mb-6 transition-all duration-350 ${
        hiding ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="card-body py-4 px-5">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">Configuration de votre espace</span>
            <span
              className={`badge badge-sm font-semibold ${
                allDone ? "badge-success" : "badge-primary"
              }`}
            >
              {completedCount} / 4
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="btn btn-xs btn-ghost text-base-content/50"
              aria-label={collapsed ? "Développer" : "Réduire"}
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={dismiss}
              className="btn btn-xs btn-ghost text-base-content/50"
              aria-label="Masquer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-base-300 rounded-full h-1.5 mb-3">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              allDone ? "bg-success" : "bg-primary"
            }`}
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>

        {/* Message de complétion */}
        {allDone && !collapsed && (
          <p className="text-sm text-success font-medium">
            Votre espace est entièrement configuré. Bonne gestion !
          </p>
        )}

        {/* Liste des étapes */}
        {!allDone && !collapsed && (
          <ul className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-base-content/25 shrink-0" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      step.done
                        ? "line-through text-base-content/40"
                        : "text-base-content/80"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {!step.done && <div className="shrink-0">{step.action}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
