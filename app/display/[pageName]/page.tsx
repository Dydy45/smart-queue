import { getTicketsForDisplay } from '@/app/actions'
import DisplayBoard from '@/app/components/DisplayBoard'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  return {
    title: `Affichage Public — SmartQueue`,
    description: `File d'attente en temps réel pour ${pageName}`,
  }
}

export default async function DisplayPage({ params }: { params: Promise<{ pageName: string }> }) {
  const { pageName } = await params
  const data = await getTicketsForDisplay(pageName)

  if (!data) {
    notFound()
  }

  return <DisplayBoard initialData={data} pageName={pageName} />
}
