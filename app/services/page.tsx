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

const page = () => {

    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress

    const [serviceName, setServiceName] = useState("")
    const [avgTime, setAvgTime] = useState(0)
    const [loading, setLoading] = useState<boolean>(false)
    const [services, setServices] = useState<Service[]>([])

    usePageTour('services', [
      {
        element: '#tour-service-form',
        popover: {
          title: '② Créez votre premier service',
          description: 'Renseignez le <b>nom du service</b> et le <b>temps moyen de traitement</b> (en minutes), puis cliquez sur « Ajouter le service ».<br><br>Exemples : <em>Consultation — 15 min</em>, <em>Caisse — 5 min</em>.',
          side: 'right',
          align: 'start',
        },
      },
    ], !!email)

    const handleCreateService = async () => {
        if (email && serviceName && avgTime > 0) {
          try {
            await createService(email, serviceName, avgTime)
            setAvgTime(0)
            setServiceName("")
            fetchServices()
          } catch (error) {
            console.error("Error creating service:", error)
          }
        }
    }

    const fetchServices = async () => {
      setLoading(true)
      try {
        if (email) {
          const serviceData = await getServiceByEmail(email)
          if (serviceData) {
            setServices(serviceData)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching services:", error)
      }
    }

    useEffect(() => {
      fetchServices()
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

          {loading ? (
            <div className='flex justify-center items-center w-full'>
              <span className="loading loading-spinner loading-xs" role="status" aria-label="Chargement des services"></span>
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
