'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import LogoutButton from './LogoutButton'

interface SidebarProps {
  userEmail: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { href: '/dashboard/tickets', label: 'Billets', icon: '🎫' },
    { href: '/dashboard/events', label: 'Événements', icon: '📅' },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-16 z-50 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6 text-gray-600 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-200 ease-in-out flex flex-col`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 px-4">
          <h1 className="text-xl font-bold text-weydu-blue dark:text-weydu-light-blue">Weydu Admin</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-weydu-blue text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connecté en tant que</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{userEmail}</p>
          </div>
          <div className="w-full">
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  )
}

