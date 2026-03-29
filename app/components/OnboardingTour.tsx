"use client"

import { useEffect } from "react"
import { driver } from "driver.js"

const TOUR_DONE_KEY = "sq_onboarding_done"

interface OnboardingTourProps {
  active: boolean
  onDone: () => void
}

export default function OnboardingTour({ active, onDone }: OnboardingTourProps) {
  useEffect(() => {
    if (!active) return

    const driverObj = driver({
      showProgress: true,
      progressText: "Étape {{current}} sur {{total}}",
      nextBtnText: "Suivant →",
      prevBtnText: "← Précédent",
      doneBtnText: "Terminer ✓",
      allowClose: true,
      smoothScroll: true,
      popoverClass: "sq-tour-popover",
      onDestroyed: () => {
        localStorage.setItem(TOUR_DONE_KEY, "1")
        onDone()
      },
      steps: [
        {
          popover: {
            title: "👋 Bienvenue sur SmartQueue !",
            description:
              "Ce guide rapide va vous aider à configurer votre espace en quelques étapes. Vous pouvez naviguer avec les boutons ci-dessous ou appuyer sur <kbd>→</kbd>.",
            side: "over",
            align: "center",
          },
        },
        {
          element: "#tour-settings-btn",
          popover: {
            title: "① Définissez votre URL publique",
            description:
              "Cliquez sur cet engrenage pour donner un nom à votre page (ex : <b>mon-cabinet</b>).<br><br>C'est l'URL que vous partagerez à vos clients pour qu'ils prennent un ticket en ligne :<br><code>smartqueue.app/page/<b>mon-cabinet</b></code>",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "#tour-sidebar-services",
          popover: {
            title: "② Créez vos services",
            description:
              "Un <b>service</b> représente une activité de votre entreprise.<br><br>Exemples : <em>Consultation médicale</em>, <em>Caisse 1</em>, <em>Support technique</em>...<br><br>Chaque service dispose de sa propre file d'attente et d'un temps moyen de traitement.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-sidebar-postes",
          popover: {
            title: "③ Créez vos postes de travail",
            description:
              "Un <b>poste</b> est un point de traitement lié à un service.<br><br>Exemples : <em>Guichet 1</em>, <em>Cabinet Dr. Martin</em>, <em>Caisse express</em>...<br><br>Vos employés utilisent les postes pour appeler et traiter les clients un par un.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-sidebar-staff",
          popover: {
            title: "④ Ajoutez vos employés",
            description:
              "Invitez vos employés par email et choisissez leur rôle :<br><ul style='margin-top:8px;padding-left:16px;'><li><b>Admin</b> — gère services et postes</li><li><b>Staff</b> — traite les tickets de ses postes assignés</li></ul><br>Assignez ensuite les postes à chaque employé pour restreindre leur accès.",
            side: "right",
            align: "start",
          },
        },
        {
          popover: {
            title: "✅ Vous êtes prêt !",
            description:
              "Votre espace SmartQueue est configuré.<br><br>🔗 <b>Partagez votre URL publique</b> aux clients pour qu'ils prennent un ticket.<br>📺 <b>Projetez l'URL d'affichage</b> sur un écran en salle d'attente.<br>📅 <b>Gérez les rendez-vous</b> depuis la rubrique Rendez-vous.<br><br>Bonne gestion !",
            side: "over",
            align: "center",
          },
        },
      ],
    })

    const timeout = setTimeout(() => {
      driverObj.drive()
    }, 700)

    return () => {
      clearTimeout(timeout)
      if (driverObj.isActive()) {
        driverObj.destroy()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return null
}
