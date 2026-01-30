import React from 'react'
import Wrapper from '../components/Wrapper'

const page = () => {
  return (
    <Wrapper>
      <div className='flex w-full'>

        <div className='space-y-2 w-1/4'>

            <span className='label-text'>Nom Du Service</span>
            <div>
                <input type="text" name="" placeholder='Nom du service' className='input input-bordered input-sm w-full' />
            </div>

            <span className='label-text'>Temps Moyen (en minutes)</span>
            <label className='input input-bordered flex items-center input-sm gap-2'>
                Temps Moyen
                <input type="number" name="" placeholder='Temps moyen' className='input-sm w-full' />
            </label>
            <button className='btn btn-primary btn-sm mt-4 w-full'>Ajouter le service</button>
        </div>


      </div>
    </Wrapper>
  )
}

export default page
