import { getServicesByPageName } from '@/app/actions'
import AppointmentCalendar from '@/app/components/AppointmentCalendar'
import { notFound } from 'next/navigation'

export async function generateMetadata() {
  return {
    title: 'Prendre rendez-vous — SmartQueue ISS/KIN',
    description: 'Réservez un créneau en ligne — Institut Supérieur des Statistiques de Kinshasa',
  }
}

export default async function AppointmentPage({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  const services = await getServicesByPageName(pageName)

  if (!services || services.length === 0) {
    notFound()
  }

  const serviceOptions = services.map((s: { id: string; name: string; avgTime: number }) => ({
    id: s.id,
    name: s.name,
    avgTime: s.avgTime,
  }))

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold">Prendre rendez-vous</h1>
        <p className="text-base-content/60 mt-2">
          Choisissez un service, une date et un créneau horaire
        </p>
      </div>
      <AppointmentCalendar services={serviceOptions} pageName={pageName} />
    </div>
  )
}
