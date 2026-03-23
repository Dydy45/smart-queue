"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Layers,
  Monitor,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Globe,
  Clock,
  Palette,
  GlobeLock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type NavGroup = {
  label: string
  links: {
    href: string
    label: string
    icon: React.ReactNode
    roles: string[]
  }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    links: [
      { href: '/home', label: 'Accueil', icon: <Home className="w-5 h-5" />, roles: ['OWNER', 'ADMIN', 'STAFF'] },
      { href: '/services', label: 'Services', icon: <Layers className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
      { href: '/poste_list', label: 'Postes', icon: <Monitor className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
    ],
  },
  {
    label: 'Gestion',
    links: [
      { href: '/staff', label: 'Staff', icon: <Users className="w-5 h-5" />, roles: ['OWNER'] },
      { href: '/appointments', label: 'Rendez-vous', icon: <Calendar className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
    ],
  },
  {
    label: 'Statistiques',
    links: [
      { href: '/dashboard', label: 'Tableau de bord', icon: <BarChart3 className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
      { href: '/feedbacks', label: 'Feedbacks', icon: <MessageSquare className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
      { href: '/estimation', label: 'Estimations', icon: <TrendingUp className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
    ],
  },
  {
    label: 'Paramètres',
    links: [
      { href: '/settings/virtual-queue', label: 'File virtuelle', icon: <Globe className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
      { href: '/settings/business-hours', label: 'Horaires', icon: <Clock className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
      { href: '/settings/theme', label: 'Thème', icon: <Palette className="w-5 h-5" />, roles: ['OWNER', 'ADMIN'] },
    ],
  },
]

interface SidebarProps {
  userRole: 'OWNER' | 'ADMIN' | 'STAFF' | null
  isRoleLoading: boolean
  pageName: string | null
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  isRoleLoading,
  pageName,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) => {
  const pathname = usePathname()

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      links: group.links.filter(
        (link) => !isRoleLoading && userRole && link.roles.includes(userRole)
      ),
    }))
    .filter((group) => group.links.length > 0)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const renderLink = (link: { href: string; label: string; icon: React.ReactNode }) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={onMobileClose}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${isActive(link.href)
          ? 'bg-primary text-primary-content'
          : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? link.label : undefined}
    >
      <span className="shrink-0">{link.icon}</span>
      {!collapsed && <span className="truncate">{link.label}</span>}
    </Link>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
                {group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-base-300 mb-2" />}
            <div className="space-y-1">
              {group.links.map(renderLink)}
            </div>
          </div>
        ))}

        {pageName && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
                Page publique
              </p>
            )}
            {collapsed && <div className="border-t border-base-300 mb-2" />}
            <Link
              href={`/page/${pageName}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMobileClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                hover:bg-base-200 text-base-content/70 hover:text-base-content
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? 'Page publique' : undefined}
            >
              <span className="shrink-0"><GlobeLock className="w-5 h-5" /></span>
              {!collapsed && <span className="truncate">Page publique</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Bouton collapse — desktop only */}
      <div className="hidden lg:block border-t border-base-300 p-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-base-200 transition-colors text-base-content/50 hover:text-base-content"
          aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-base-100 border-r border-base-300
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Menu principal"
      >
        {sidebarContent}
      </aside>

      {/* Sidebar desktop */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0 h-screen sticky top-0
          bg-base-100 border-r border-base-300
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-60'}
        `}
        role="navigation"
        aria-label="Menu principal"
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export default Sidebar
