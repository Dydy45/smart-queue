/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { createService } from '../actions'

const page = () => {

    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress

    const [serviceName, setServiceName] = useState("")
    const [avgTime, setAvgTime] = useState(0)

    const handleCreateService = async () => {
        if (email && serviceName && avgTime > 0) {
          try {
            await createService(email, serviceName, avgTime)
            setAvgTime(0)
            setServiceName("")
          } catch (error) {
            console.error("Error creating service:", error)
          }
        }
    }


  return (
    <Wrapper>
      <div className='flex w-full'>

        <div className='space-y-2 w-1/4'>

            <span className='label-text'>Nom Du Service</span>
            <div>
                <input type="text" name="" placeholder='Nom du service' className='input input-bordered input-sm w-full' value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
            </div>

            <span className='label-text'>Temps Moyen (en minutes)</span>
            <label className='input input-bordered flex items-center input-sm gap-2'>
                Temps Moyen
                <input type="number" name="" placeholder='Temps moyen' className='input-sm w-full' value={avgTime || ''} onChange={(e) => setAvgTime(Number(e.target.value))} />
            </label>
            <button className='btn btn-primary btn-sm mt-4 w-full' onClick={handleCreateService}>Ajouter le service</button>
        </div>


      </div>
    </Wrapper>
  )
}

export default page
