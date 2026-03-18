import { getServicesByPageName } from '@/app/actions'
import AppointmentCalendar from '@/app/components/AppointmentCalendar'
import CompanyThemeProvider from '@/app/components/CompanyThemeProvider'
import { getCompanyTheme } from '@/app/actions/theme'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  const theme = await getCompanyTheme(pageName)
  return {
    title: theme ? `Prendre rendez-vous — ${theme.name}` : 'Prendre rendez-vous — SmartQueue',
    description: `Réservez un créneau en ligne pour ${pageName}`,
  }
}

export default async function AppointmentPage({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  const [services, theme] = await Promise.all([
    getServicesByPageName(pageName),
    getCompanyTheme(pageName),
  ])

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
      <CompanyThemeProvider
        primaryColor={theme?.primaryColor}
        accentColor={theme?.accentColor}
        logoUrl={theme?.logoUrl}
        companyName={theme?.name}
        description={theme?.description}
      >
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-bold">Prendre rendez-vous</h1>
          <p className="text-base-content/60 mt-2">
            Choisissez un service, une date et un créneau horaire
          </p>
        </div>
        <AppointmentCalendar services={serviceOptions} pageName={pageName} />
      </CompanyThemeProvider>
    </div>
  )
}
