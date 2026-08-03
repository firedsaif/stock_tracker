import Link from 'next/link'
import { logout } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Package, LayoutDashboard, History, LogOut, Users, Trash2, Wallet, UserCheck, Trash } from 'lucide-react'
import { getUserRole } from '@/utils/roles'
import { deleteMyAccount } from '@/app/actions'

import { MobileMenu } from './mobile-menu'

export async function Navbar() {
  const { role } = await getUserRole()
  const canManage = role === 'SUPER_OWNER' || role === 'OWNER'

  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6">
        <MobileMenu canManage={canManage} />
        
        <div className="flex items-center gap-2 font-bold text-xl mr-6 ml-2 lg:ml-0">
          <Package className="h-6 w-6" />
          <span className="hidden sm:inline">JAAD INDUSTRY</span>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-4 flex-1">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/inventory"
            className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            <span>Inventory</span>
          </Link>
          {canManage && (
            <>
              <Link
                href="/transactions"
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
              <Link
                href="/team"
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Owners</span>
              </Link>
              <Link
                href="/employees"
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Employees</span>
              </Link>
              <Link
                href="/attendance"
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                <span>Attendance</span>
              </Link>
              <Link
                href="/finance"
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Finance</span>
              </Link>
              <Link
                href="/recycle-bin"
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                <span>Recycle Bin</span>
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <form action={deleteMyAccount}>
            <Button variant="ghost" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete My Account</span>
            </Button>
          </form>
          <form action={logout}>
            <Button variant="ghost" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
