/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { createService, deleteServiceById, getServiceByEmail } from '../actions'
import { Service } from '../generated/prisma'
import { Clock2, ClockArrowUp, Trash } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { usePageTour } from '@/lib/usePageTour'
import SkeletonTable from '../components/SkeletonTable'

const page = () => {

    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress

    const [serviceName, setServiceName] = useState("")
    const [avgTime, setAvgTime] = useState(0)
    const [loading, setLoading] = useState<boolean>(false)
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
    const [services, setServices] = useState<Service[]>([])

    usePageTour('services', [
      {
        element: '#tour-service-form',
        popover: {
          title: 'Créez votre premier service',
          description: 'Renseignez le <strong>nom du service</strong> et le <strong>temps moyen de traitement</strong> en minutes, puis cliquez sur <em>Ajouter le service</em>.<br><br>Exemples : Consultation 15 min, Caisse 5 min.',
          side: 'right',
          align: 'start',
        },
      },
    ], !!email)

    const handleCreateService = async () => {
        if (email && serviceName && avgTime > 0) {
          try {
            setLoading(true)
            await createService(email, serviceName, avgTime)
            setAvgTime(0)
            setServiceName("")
            await fetchServices()
          } catch (error) {
            console.error("Error creating service:", error)
          } finally {
            setLoading(false)
          }
        }
    }

    const fetchServices = async (isFirst = false) => {
      if (isFirst) setLoading(true)
      try {
        if (email) {
          const serviceData = await getServiceByEmail(email)
          if (serviceData) {
            setServices(serviceData)
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        if (isFirst) {
          setLoading(false)
          setIsInitialLoad(false)
        }
      }
    }

    useEffect(() => {
      if (email) fetchServices(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email])

    const handleDeleteService = async (serviceId: string) => {
      const confirmation = window.confirm("Êtes-vous sûr de vouloir supprimer ce service ? tous les rendez-vous associés seront également supprimés.")
      if (confirmation) {
        try {
          await deleteServiceById(serviceId)
          fetchServices()
        } catch (error) {
          console.error("Error deleting service:", error)
        }
      }
    }


  return (
    <Wrapper>
      <div className='flex w-full  flex-col md:flex-row'>

        <div id="tour-service-form" className='space-y-2 md:w-1/4 w-full'>

            <span className='label-text'>Nom Du Service</span>
            <div>
                <input type="text" name="" placeholder='Nom du service' className='input input-bordered input-sm w-full' value={serviceName} onChange={(e) => setServiceName(e.target.value)} aria-label="Nom du service" />
            </div>

            <span className='label-text'>Temps Moyen (en minutes)</span>
            <label className='input input-bordered flex items-center input-sm gap-2'>
                <ClockArrowUp className='w-4 h-4'/>
                <input
                  type="number"
                  className="grow"
                  placeholder="20min"
                  value={avgTime}
                  onChange={(e) => setAvgTime(Number(e.target.value))}
                  aria-label="Temps moyen en minutes"
                />
            </label>
            <button className='btn btn-primary btn-sm mt-4' onClick={handleCreateService} disabled={loading}>
              {loading ? (
                <><span className='loading loading-spinner loading-sm' role="status" aria-label="Chargement"></span>Ajout...</>
              ) : 'Ajouter le service'}
            </button>
        </div>

        <div className='mt-4 md:mt-0 md:ml-4 md:w-3/4 md:border-l border-base-200 md:pl-4 w-full'>
          <h3 className='font-semibold'>Liste des services</h3>

          {isInitialLoad ? (
            <div className="overflow-x-auto">
              <table className="table w-fit">
                <tbody>
                  <SkeletonTable rows={4} cols={[6, 48, 20, 10]} />
                </tbody>
              </table>
            </div>
          ) : services.length === 0 ?  (
            <div>
              <EmptyState IconComponent={'Telescope'} message={'Aucun service pour le moment'} />
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="table w-fit">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom du Service</th>
                      <th>Temps Moyen (min)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service, index) => (
                      <tr key={service.id}>
                      <th>{index + 1}</th>
                      <td>{service.name}</td>
                      <td className='flex items-center'> <Clock2 className="w-4 h-4 inline mr-2" />{service.avgTime} min</td>
                      <td>
                        <button
                          className='btn btn-xs btn-error'
                          onClick={() => handleDeleteService(service.id)}
                          aria-label={`Supprimer le service ${service.name}`}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    ))}
                    
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </Wrapper>
  )
}

export default page
