import { useEffect } from "react"
import { driver, type DriveStep } from "driver.js"

/**
 * Hook qui déclenche un mini-tour driver.js pour une page donnée.
 * Le tour ne s'affiche qu'une seule fois (clé localStorage = `sq_tour_<pageKey>`).
 *
 * @param pageKey  Identifiant unique de la page (ex: "services", "postes", "staff")
 * @param steps    Étapes driver.js à afficher
 * @param enabled  Si false, le tour ne se lance pas (ex: en attente de chargement)
 */
export function usePageTour(
  pageKey: string,
  steps: DriveStep[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return
    const key = `sq_tour_${pageKey}`
    if (localStorage.getItem(key)) return

    const driverObj = driver({
      showProgress: true,
      progressText: "Étape {{current}} sur {{total}}",
      nextBtnText: "Suivant →",
      prevBtnText: "← Précédent",
      doneBtnText: "OK, j'ai compris !",
      allowClose: true,
      smoothScroll: true,
      onDestroyed: () => localStorage.setItem(key, "1"),
      steps,
    })

    const timeout = setTimeout(() => driverObj.drive(), 600)

    return () => {
      clearTimeout(timeout)
      if (driverObj.isActive()) driverObj.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
