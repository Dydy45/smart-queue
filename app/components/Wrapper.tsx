"use client"

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { initUserSession } from '../actions'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

type WrapperProps = {
    children: React.ReactNode;
}

const Wrapper = ({ children }: WrapperProps) => {
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress

    const [pageName, setPageName] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<'OWNER' | 'ADMIN' | 'STAFF' | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sq_user_role') as 'OWNER' | 'ADMIN' | 'STAFF' | null
        }
        return null
    })
    const [isRoleLoading, setIsRoleLoading] = useState(false)

    // Sidebar state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sq_sidebar_collapsed') === 'true'
        }
        return false
    })
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem('sq_sidebar_collapsed', String(sidebarCollapsed))
    }, [sidebarCollapsed])

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
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                userRole={userRole}
                isRoleLoading={isRoleLoading}
                pageName={pageName}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Navbar
                    email={email}
                    pageName={pageName}
                    onPageNameChange={setPageName}
                    onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
                />

                <main className="flex-1 overflow-y-auto px-5 lg:px-10 py-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default Wrapper;