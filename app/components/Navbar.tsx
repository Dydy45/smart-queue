"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import { AudioWaveform, Link, Menu } from 'lucide-react'
import React from 'react'

const Navbar = () => {
    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress
    
    const navLinks =[
        {href: '/', label: "Accueil"},
    ]

    const renderLinks = (classNames: string) => (
        <>
            {navLinks.map(({ href, label }) => (
                <Link key={href} href={href} className={`${classNames} btn-sm`}>
                    {label}
                </Link>
            ))}
        </>
    )

  return (
    <div className='border-b border-base-300 px-5 md:px-[10%] py-4 relative'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center'>
          <div className='rounded-full p-2'>
            <AudioWaveform  className='w-6 h-6 text-primary'/>
          </div>
          <span className='font-bold text-xl text-black'>
            SmartQueue
          </span>
        </div>

        <button className='btn w-fit btn-sm'>
            <Menu className='w-4'/>
        </button>

        <div className='hidden space-x-2 sm:flex items-center'>
            {renderLinks("btn")}
            <UserButton />
        </div>
      </div>
    </div>
  )
}

export default Navbar
