"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { driver } from "driver.js"

const TOUR_DONE_KEY = "sq_onboarding_done"

interface OnboardingTourProps {
  active: boolean
  onDone: () => void
}

export default function OnboardingTour({ active, onDone }: OnboardingTourProps) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return

    const called = { done: false }
    const finish = () => {
      if (called.done) return
      called.done = true
      localStorage.setItem(TOUR_DONE_KEY, "1")
      onDone()
    }

    let driverObj: ReturnType<typeof driver> | null = null

    const goTo = (path: string) => {
      finish()
      driverObj?.destroy()
      router.push(path)
    }

    driverObj = driver({
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Continuer",
      prevBtnText: "Retour",
      doneBtnText: "Terminer",
      allowClose: true,
      smoothScroll: true,
      onDestroyed: finish,
      onNextClick: () => {
        const idx = driverObj!.getActiveIndex()
        if (idx === 2) return goTo("/services")
        if (idx === 3) return goTo("/poste_list")
        if (idx === 4) return goTo("/staff")
        driverObj!.moveNext()
      },
      steps: [
        {
          popover: {
            title: "Bienvenue sur SmartQueue",
            description:
              "Ce guide vous accompagne pas à pas pour configurer votre espace. Chaque étape demande une action de votre part.",
            side: "over",
            align: "center",
            nextBtnText: "Démarrer la configuration",
          },
        },
        {
          element: "#tour-settings-btn",
          popover: {
            title: "Étape 1 — Définissez votre URL publique",
            description:
              "Cliquez sur ce bouton pour ouvrir les paramètres. Saisissez un nom unique pour votre page (ex. <code>mon-cabinet</code>), puis enregistrez. Ce sera l'URL partagée à vos clients.",
            side: "bottom",
            align: "end",
            nextBtnText: "C'est fait, continuer",
          },
        },
        {
          element: "#tour-sidebar-services",
          popover: {
            title: "Étape 2 — Créez vos services",
            description:
              "Un service représente une activité de votre établissement (ex. Consultation, Caisse, Support). Cliquez sur <strong>Aller aux services</strong> pour en créer un — vous y serez guidé.",
            side: "right",
            align: "start",
            nextBtnText: "Aller aux services",
          },
        },
        {
          element: "#tour-sidebar-postes",
          popover: {
            title: "Étape 3 — Créez vos postes de travail",
            description:
              "Un poste est un point de traitement lié à un service (ex. Guichet 1, Cabinet Dr. Martin). Vos employés y appellent les clients. Cliquez sur <strong>Aller aux postes</strong> pour en créer un.",
            side: "right",
            align: "start",
            nextBtnText: "Aller aux postes",
          },
        },
        {
          element: "#tour-sidebar-staff",
          popover: {
            title: "Étape 4 — Ajoutez vos employés",
            description:
              "Invitez vos employés par email et choisissez leur rôle : <strong>Admin</strong> (gère services et postes) ou <strong>Staff</strong> (traite les tickets de ses postes assignés). Cliquez sur <strong>Aller au staff</strong> pour les ajouter.",
            side: "right",
            align: "start",
            nextBtnText: "Aller au staff",
          },
        },
        {
          popover: {
            title: "Configuration terminée",
            description:
              "Votre espace est prêt.<br><br>Partagez votre <strong>URL publique</strong> à vos clients pour qu'ils prennent un ticket en ligne.<br>Projetez l'<strong>URL d'affichage</strong> sur un écran en salle d'attente.",
            side: "over",
            align: "center",
          },
        },
      ],
    })

    const timeout = setTimeout(() => {
      driverObj!.drive()
    }, 700)

    return () => {
      clearTimeout(timeout)
      if (driverObj?.isActive()) {
        driverObj.destroy()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return null
}
