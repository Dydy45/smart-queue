"use client"
/* eslint-disable react-hooks/rules-of-hooks */
import { getServicesByPageName } from '@/app/actions'
import { Service } from '@/app/generated/prisma/client'
import { useState, useEffect } from 'react'


const page = ({params} : {params: Promise<{pageName: string}>}) => {

  const [pageName, setPageName] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])

    const resolveParamsAndFetchServices = async () => {
      try {
        const resolvedParams = await params
        setPageName(resolvedParams.pageName)
        const servicesList = await getServicesByPageName(resolvedParams.pageName)
        if (servicesList) {
          setServices(servicesList)
        }
      } catch (error) {
        console.error(error)
      }
    }

    useEffect(() =>{
      resolveParamsAndFetchServices()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

  return (
    <div className='px-5 md:px-[10%] mt-8 mb-10'>
      <div className=''>
        <h1 className='text-2xl font-bold'>Bienvenue sur <span className='badge badge-primary ml-2'>@{pageName}</span></h1>
        <p className='text-md'>Créez votre ticket</p>
      </div>
      <div className='flex flex-col md:flex-row w-full mt-4'>
        <form className='flex flex-col space-y-2 md:w-96'>
          <select className="select select-bordered w-full">
            <option disabled value="">Choisissez un service</option>
            {services.map((services) => (
              <option key={services.id} value={services.id}>
                {services.name} - ({services.avgTime} min)
              </option>
            ))}
          </select>
          <input
            type='text'
            placeholder='Quel est votre nom ?'
            className='input input-bordered w-full'
          />
          <button className='btn btn-primary w-fit'>Go</button>
        </form>
      </div>
    </div>
  )
}

export default page
