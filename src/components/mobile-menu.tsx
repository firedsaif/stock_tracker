'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Package, LayoutDashboard, History, Users, Wallet, UserCheck, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileMenu({ canManage }: { canManage: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/inventory', icon: Package, label: 'Inventory' },
  ]

  const adminLinks = [
    { href: '/transactions', icon: History, label: 'History' },
    { href: '/team', icon: Users, label: 'Owners' },
    { href: '/employees', icon: Users, label: 'Employees' },
    { href: '/attendance', icon: UserCheck, label: 'Attendance' },
    { href: '/finance', icon: Wallet, label: 'Finance' },
    { href: '/recycle-bin', icon: Trash, label: 'Recycle Bin' },
  ]

  const allLinks = canManage ? [...links, ...adminLinks] : links

  return (
    <div className="lg:hidden">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <Menu className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col animate-in slide-in-from-left-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex flex-col space-y-1 px-2">
                {allLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
