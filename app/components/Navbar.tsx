"use client"

import { UserButton } from '@clerk/nextjs'
import { AudioWaveform, Menu, Moon, Settings, Sun } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import SettingsModal from './SettingsModal'
import InstallPWA from './InstallPWA'

interface NavbarProps {
    email: string | undefined
    pageName: string | null
    onPageNameChange: (name: string | null) => void
    onMobileMenuToggle: () => void
}

const Navbar: React.FC<NavbarProps> = ({ email, pageName, onPageNameChange, onMobileMenuToggle }) => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark'
        }
        return false
    })

    useEffect(() => {
        const html = document.documentElement
        html.setAttribute('data-theme', isDark ? 'dark' : 'valentine')
        localStorage.setItem('theme', isDark ? 'dark' : 'valentine')
    }, [isDark])

    return (
        <header className="border-b border-base-300 px-4 py-3 bg-base-100 sticky top-0 z-30">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {/* Hamburger — mobile only */}
                    <button
                        className="btn btn-sm btn-ghost btn-square lg:hidden"
                        onClick={onMobileMenuToggle}
                        aria-label="Ouvrir le menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <AudioWaveform className="w-6 h-6 text-primary" />
                        <div className="flex flex-col leading-tight">
                            <span className="font-bold text-base leading-none">SmartQueue</span>
                            <span className="text-xs text-primary/70 font-semibold leading-none tracking-wide">ISS/KIN</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        id="tour-settings-btn"
                        className="btn btn-sm btn-primary btn-circle"
                        onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}
                        aria-label="Ouvrir les paramètres"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    <button
                        className="btn btn-sm btn-ghost btn-circle"
                        onClick={() => setIsDark(!isDark)}
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <InstallPWA />
                    <UserButton />
                </div>
            </div>

            <SettingsModal
                email={email}
                pageName={pageName}
                onPageNameChange={onPageNameChange}
            />
        </header>
    )
}

export default Navbar