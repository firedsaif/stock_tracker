import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  eyebrow,
  back,
  actions,
  children,
}: {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  back?: { href: string; label: string }
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="mb-6 px-4 sm:px-0">
      {back && (
        <Link
          href={back.href}
          className="-ml-1 mb-3 inline-flex items-center gap-0.5 text-sm text-ink-soft hover:text-ink"
        >
          <ChevronLeft className="size-4" /> {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="font-condensed text-[2rem] leading-none font-semibold tracking-tight text-balance sm:text-[2.5rem]">
            {title}
          </h1>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

export function Section({
  title,
  aside,
  children,
  className,
}: {
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-9', className)}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3 px-4 sm:px-0">
        <h2 className="eyebrow">{title}</h2>
        {aside && <div className="text-sm">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

export function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="ledger px-5 py-10 text-center">
      <p className="text-sm text-ink-soft">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'ok', children }: { tone?: 'ok' | 'error'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md px-3 py-2.5 text-sm',
        tone === 'error' ? 'bg-khata-wash text-khata' : 'bg-green-wash text-green'
      )}
    >
      {children}
    </p>
  )
}
