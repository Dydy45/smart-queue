'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="text-6xl">📡</div>
        <h1 className="text-3xl font-bold">Mode Hors-ligne</h1>
        <p className="text-base-content/70">
          Vous n&apos;êtes pas connecté à Internet. Certaines fonctionnalités
          sont temporairement indisponibles.
        </p>
        <div className="bg-base-100 rounded-xl p-4 text-left space-y-2">
          <p className="font-semibold">Fonctionnalités disponibles :</p>
          <ul className="list-disc list-inside text-sm text-base-content/70 space-y-1">
            <li>Consulter les pages déjà visitées (en cache)</li>
            <li>Voir vos informations en cache</li>
          </ul>
          <p className="font-semibold mt-3">Non disponibles hors-ligne :</p>
          <ul className="list-disc list-inside text-sm text-base-content/70 space-y-1">
            <li>Créer un nouveau ticket</li>
            <li>Appeler un ticket</li>
            <li>Données en temps réel</li>
          </ul>
        </div>
        <button
          onClick={() => typeof window !== 'undefined' && window.location.reload()}
          className="btn btn-primary"
        >
          Réessayer la connexion
        </button>
      </div>
    </div>
  )
}
