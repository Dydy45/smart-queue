'use client'

import { useEffect, useState } from 'react'

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setShowUpdate(true)
          }
        })
      })
    })
  }, [])

  const handleUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="toast toast-top toast-center z-9999">
      <div className="alert alert-info shadow-lg">
        <span>🔄 Une nouvelle version est disponible !</span>
        <button onClick={handleUpdate} className="btn btn-sm btn-ghost">
          Mettre à jour
        </button>
      </div>
    </div>
  )
}
