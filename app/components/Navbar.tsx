"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import { AudioWaveform, GlobeLock, Menu, Moon, Settings, Sun, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { initUserSession } from '../actions'
import SettingsModal from './SettingsModal'
import InstallPWA from './InstallPWA'

const Navbar = () => {
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress
    const [menuOpen, setMenuOpen] = useState(false)
    const [pageName, setPageName] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<'OWNER' | 'ADMIN' | 'STAFF' | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sq_user_role') as 'OWNER' | 'ADMIN' | 'STAFF' | null
        }
        return null
    })
    const [isRoleLoading, setIsRoleLoading] = useState(false)
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark'
        }
        return false
    })

    // Filtrer les liens selon le rôle
    const getNavLinks = () => {
        const allLinks = [
            { href: "/home", label: "Accueil", roles: ['OWNER', 'ADMIN', 'STAFF'] },
            { href: "/services", label: "Vos services", roles: ['OWNER', 'ADMIN'] },
            { href: "/poste_list", label: "Vos postes", roles: ['OWNER', 'ADMIN'] },
            { href: "/staff", label: "Gestion Staff", roles: ['OWNER'] },
            { href: "/dashboard", label: "Tableau de bord", roles: ['OWNER', 'ADMIN'] },
            { href: "/feedbacks", label: "Feedbacks", roles: ['OWNER', 'ADMIN'] }
        ]
        
        // Si chargement ou rôle inconnu, n'afficher que les liens communs
        if (isRoleLoading || !userRole) return [{ href: "/home", label: "Accueil", roles: ['OWNER', 'ADMIN', 'STAFF'] }]
        
        return allLinks.filter(link => link.roles.includes(userRole))
    }
    
    const navLinks = getNavLinks()

    const renderLinks = (classNames: string) => (
        <>
            <button className="btn btn-sm btn-primary btn-circle"
                onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
                aria-label="Ouvrir les paramètres"
            >
                <Settings className='w-4 h-4' />
            </button>

            <button 
                className="btn btn-sm btn-ghost btn-circle" 
                onClick={() => setIsDark(!isDark)}
                aria-label="Toggle dark mode"
            >
                {isDark ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
            </button>

            {navLinks.map(({ href, label }) => (
                <Link href={href} key={href} className={`${classNames} btn-sm `}>{label}</Link>
            ))}

            {pageName && (
                <Link href={`/page/${pageName}`} className={`${classNames} btn-sm `}>
                    <GlobeLock className='w-4 h-4' />
                </Link>
            )}
        </>
    )

    useEffect(() => {
        const html = document.documentElement
        html.setAttribute('data-theme', isDark ? 'dark' : 'valentine')
        localStorage.setItem('theme', isDark ? 'dark' : 'valentine')
    }, [isDark])

    useEffect(() => {
        const init = async () => {
            if (email && user.fullName) {
                setIsRoleLoading(true)
                
                const { role, pageName } = await initUserSession(email, user.fullName)
                
                if (pageName) setPageName(pageName)
                
                if (role) {
                    localStorage.setItem('sq_user_role', role)
                } else {
                    localStorage.removeItem('sq_user_role')
                }
                
                setUserRole(role)
                setIsRoleLoading(false)
            }
        }
        init()
    }, [user, email])

    return (
        <div className='border-b  border-base-300 px-5 md:px-[10%] py-4 relelative '>
            <div className='flex justify-between items-center'>
                <div className='flex items-center'>
                    <div className='rounded-full p-2'>
                        <AudioWaveform className='w-6 h-6 text-primary' />
                    </div>
                    <span className='font-bold text-xl'>
                        SmartQueue
                    </span>
                </div>

                <button className=' btn w-fit btn-sm sm:hidden' onClick={() => setMenuOpen(!menuOpen)} aria-label="Ouvrir le menu" aria-expanded={menuOpen}>
                    <Menu className='w-4' />
                </button>

                <div className=' hidden space-x-2 sm:flex items-center'>
                    {renderLinks("btn")}
                    <InstallPWA />
                    <UserButton />
                </div>
            </div>

            <div className={`absolute top-0 w-full bg-base-100  h-screen flex flex-col gap-2 p-4 transition-all duration-300 sm:hidden z-50 ${menuOpen ? "left-0" : "-left-full"}`}>
                <div className=' flex justify-between'>
                    <UserButton />
                    <button className=' btn w-fit btn-sm sm:hidden' onClick={() => setMenuOpen(!menuOpen)} aria-label="Fermer le menu">
                        <X className='w-4' />
                    </button>
                </div>
                {renderLinks("btn")}
                <InstallPWA />
            </div>

            <SettingsModal
                email={email}
                pageName={pageName}
                onPageNameChange={setPageName}
            />

        </div>
    )
}

export default Navbar