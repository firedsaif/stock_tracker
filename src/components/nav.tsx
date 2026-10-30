'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Boxes, History, LogOut, Plus, Users } from 'lucide-react'
import { logout } from '@/app/(main)/actions'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/', label: 'This month', short: 'Home', icon: BookOpen },
  { href: '/stock', label: 'Stock', short: 'Stock', icon: Boxes },
  { href: '/people', label: 'People', short: 'People', icon: Users },
  { href: '/history', label: 'All entries', short: 'Entries', icon: History },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function BrandMark({ className }: { className?: string }) {
  // A closed khata: red cover with the ruled margin line.
  return (
    <span aria-hidden className={cn('relative inline-block size-6 rounded-[5px] bg-khata', className)}>
      <span className="absolute inset-y-1 left-[7px] w-px bg-khata-ink/70" />
    </span>
  )
}

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop rail */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-rule bg-sheet px-3 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <BrandMark />
          <span className="font-condensed text-lg font-semibold tracking-tight">Stock Khata</span>
        </Link>

        <Link href="/entry/new" className="btn-primary mb-6 w-full">
          <Plus className="size-4" /> New entry
        </Link>

        <ul className="space-y-0.5">
          {tabs.map((t) => {
            const active = isActive(pathname, t.href)
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink',
                    active && 'bg-paper text-ink'
                  )}
                >
                  <t.icon className={cn('size-4', active && 'text-khata')} />
                  {t.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <form action={logout} className="mt-auto">
          <button className="flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm text-ink-faint transition-colors hover:bg-paper hover:text-ink">
            <LogOut className="size-4" /> Log out
          </button>
        </form>
      </nav>

      {/* Phone tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-sheet/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5 items-end">
          {tabs.slice(0, 2).map((t) => (
            <TabLink key={t.href} {...t} active={isActive(pathname, t.href)} />
          ))}
          <li className="flex justify-center">
            <Link
              href="/entry/new"
              aria-label="New entry"
              className="-mt-5 mb-1.5 flex size-14 items-center justify-center rounded-full bg-khata text-khata-ink shadow-[0_6px_16px_-6px_var(--khata)] ring-4 ring-paper transition-transform active:scale-95"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </Link>
          </li>
          {tabs.slice(2).map((t) => (
            <TabLink key={t.href} {...t} active={isActive(pathname, t.href)} />
          ))}
        </ul>
      </nav>
    </>
  )
}

function TabLink({
  href,
  short,
  icon: Icon,
  active,
}: (typeof tabs)[number] & { active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-ink-faint',
          active && 'text-ink'
        )}
      >
        <Icon className={cn('size-5', active && 'text-khata')} strokeWidth={active ? 2.25 : 1.75} />
        {short}
      </Link>
    </li>
  )
}
