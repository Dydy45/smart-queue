import { getTicketsForDisplay } from '@/app/actions'
import DisplayBoard from '@/app/components/DisplayBoard'
import { getCompanyTheme } from '@/app/actions/theme'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  const theme = await getCompanyTheme(pageName)
  return {
    title: theme ? `Affichage Public — ${theme.name}` : 'Affichage Public — SmartQueue',
    description: `File d'attente en temps réel pour ${pageName}`,
  }
}

export default async function DisplayPage({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  const [data, theme] = await Promise.all([
    getTicketsForDisplay(pageName),
    getCompanyTheme(pageName),
  ])

  if (!data) {
    notFound()
  }

  return (
    <DisplayBoard
      initialData={data}
      pageName={pageName}
      companyName={theme?.name}
      logoUrl={theme?.logoUrl}
      primaryColor={theme?.primaryColor}
    />
  )
}
